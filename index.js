import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';
import rl from 'readline-promise';
import Database from 'better-sqlite3';

// args
const myArgs = process.argv.slice(2);

// constants
const SERVER_ADDRESS = "http://localhost";
const REST_API_PORT = 80;
const GRAPHQL_API_PORT = 4000;
const GRID_X_MAX = 6;
const GRID_Y_MAX = 4;
const ORIENTATIONS = [ 'N', 'E', 'S', 'W' ];
const INSTRUCTION_STRING_MAX = 100;

// database
const options = { 
	verbose: (message) => { console.log(message) } 
};
const BetterSqlite3 = new Database('store.db', options);

const createTableSQL = (query) => {
	BetterSqlite3.exec(query);
}

const insertSQL = (query, ...parameters) => {
	return BetterSqlite3.prepare(query).run(...parameters);
}

createTableSQL("CREATE TABLE IF NOT EXISTS inputs(" +
	"id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT," +
	"type VARCHAR(1)," +
	"instruction VARCHAR(255)," +
	"timestamp DATETIME DEFAULT 0" +
")");

createTableSQL("CREATE TABLE IF NOT EXISTS movements(" +
	"id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT," +
	"input INTEGER," +
	"result VARCHAR(255)," +
	"timestamp DATETIME DEFAULT 0" +
")");

createTableSQL("CREATE TABLE IF NOT EXISTS outputs(" +
	"id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT," +
	"input INTEGER," +
	"result VARCHAR(255)," +
	"timestamp DATETIME DEFAULT 0" +
")");

const regx_orientation = new RegExp(/[NSEW]/);
const regx_movement = new RegExp(/[LRF]/);

// variables
let map = {
	grid: new Array(GRID_Y_MAX).fill(0),
	x: 0,
	y: 0,
	o: 'N'
}

for (var y = 0; y < GRID_Y_MAX; y++) {
	map.grid[y] = new Array(GRID_X_MAX);
	map.grid[y].fill(0);
}

console.log(myArgs);

const getTimestamp = () => {
	return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

const storeMovement = (id, result) => {
	insertSQL(
		'INSERT OR IGNORE INTO movements VALUES (@id, @input, @result, @timestamp)', 
		{ 
			id: null, 
			input: id, 
			result: result,
			timestamp: getTimestamp()
		}
	);
}

const newPosition = (id) => {
	const result = map.x + " " + map.y + " " + map.o;
	storeMovement(id, result);
	return result;
}

const lost = (id, x, y, o) => {
	const result = x + " " + y + " " + o + " LOST";
	storeMovement(id, result);
	return result;
}

const setGrid = (x, y, i) => {
	map.grid[GRID_Y_MAX-y-1][x] = i;
}

const setPosition = (id, x, y, o) => {
	if(x >= GRID_X_MAX || x < 0) {
		return lost(id, x, y, o);
	} else if(y >= GRID_Y_MAX || y < 0) {
		return lost(id, x, y, o);
	} else if(regx_orientation.test(o) === false) {
		return "Orientation error, expected N S E or W";
	} else {
		setGrid(map.x, map.y, 0);
		setGrid(x, y, 1);
		map.x = x;
		map.y = y;
		map.o = o;
		console.log(map);
		return newPosition(id);
	}
}

const moveForward = (id) => {
	switch(map.o)
	{
		case 'N': return setPosition(id, map.x, map.y+1, map.o);
		case 'E': return setPosition(id, map.x+1, map.y, map.o);
		case 'S': return setPosition(id, map.x, map.y-1, map.o);
		case 'W': return setPosition(id, map.x-1, map.y, map.o);
		default: return "Orientation not found";
	}
}

const processMovement = (id, m) => {
	let index = ORIENTATIONS.indexOf(map.o);
	switch(m)
	{
		case 'L':
			if(index > 0) 
				index--; 
			else 
				index = ORIENTATIONS.length - 1;
		break;

		case 'R':
			if((ORIENTATIONS.length-1) > index) 
				index++; 
			else 
				index = 0;
		break;

		case 'F': return moveForward(id);
		default: return "Movement not found";
	}
	map.o = ORIENTATIONS[index];
	return newPosition(id);
}

const processCommand = (id, args) => {
	if(args.length === 3) {
		const posx = parseInt(args[0]);
		const posy = parseInt(args[1]);
		const o = args[2].substring(0, 1);
		return [setPosition(id, posx, posy, o)];
	} else {
		return ["Missing args"];
	}
}

const processMovementArgs = (id, args) => {
	if(args.length === 1) {
		const characters = args[0];
		let results = [];
		if(INSTRUCTION_STRING_MAX >= characters.length) 
		{
			for (let i = 0; i < characters.length; i++) {
				const char = characters.charAt(i);
				if(regx_movement.test(char)) {
					results.push(processMovement(id, char));
				} else {
					results.push("error char " + char);
				}
			}
		} 
		else {
			return ["To many instructions, " + INSTRUCTION_STRING_MAX + " max"];
		}
		return results;
	} else {
		return ["Missing args"];
	}
}

const commands = [
	{ command: "", description: "Enter command", syntax: "", func: () => {} },
	{ command: "h", description: "help", syntax: "h", func: () => { 
		let stringArray = [];
		commands.forEach(c => { 
			if(c.command.length > 0) { 
				stringArray.push(c.command + ' ' + c.description + ' usage: ' + c.syntax); 
			} 
		})
		return stringArray;
	}},
	{ command: "c", description: "command", syntax: "c x y o", func: (id, qargs) => processCommand(id, qargs) },
	{ command: "m", description: "movement", syntax: "m LFRF", func: (id, qargs) => processMovementArgs(id, qargs) },
];

const getInstructionFromArgs = (...args) => {
	return args.sort(function (a, b) { return a - b; }).toString().replace(/,/g, ' ');
}

const findCommand = (qargs) => {
	if(qargs.length > 0) {
		const command = qargs[0];
		const found = commands.find(element => element.command === command);
		qargs.shift();
		if(typeof found !== 'undefined') {
			const newRun = insertSQL(
				'INSERT OR IGNORE INTO inputs VALUES (@id, @type, @instruction, @timestamp)', 
				{ 
					id: null, 
					type: command, 
					instruction: getInstructionFromArgs(qargs),
					timestamp: getTimestamp()
				}
			);
			const results = found.func(newRun.lastInsertRowid, qargs);
			if(results.length > 0) {
				const lastResult = results[results.length-1];
				insertSQL(
					'INSERT OR IGNORE INTO outputs VALUES (@id, @input, @result, @timestamp)', 
					{ 
						id: null, 
						input: newRun.lastInsertRowid, 
						result: lastResult,
						timestamp: getTimestamp()
					}
				);
				return results;
			}
			else {
				return ["No results found!"];
			}
		}
	}
	return ["Command not found!"];
}

const checkCommandArgs = (commandArgs) => {
	const qargs = commandArgs.split(/(\s+)/).filter( e => e.trim().length > 0);
	return findCommand(qargs);
}

findCommand(myArgs);

// rest
const restapp = express();

restapp.get('/', (req, res) => {
	return res.send('Be aware of Martian Robots!');
});

restapp.get('/command/:args', (req, res) => {
	const args = req.params.args
	console.log(args);
	return res.send(checkCommandArgs(args));
});

restapp.listen(REST_API_PORT);

console.log('Running a REST API server at ' + SERVER_ADDRESS + ':' + REST_API_PORT);

// graphql
const graphqlapp = express();

const schema = buildSchema(`
	type Query {
		command(args: String): [String]
	}
`);

const root = {
	command: ({args}) => {
		return checkCommandArgs(args);
	},
};

graphqlapp.use('/graphql', graphqlHTTP({
	schema: schema,
	rootValue: root,
	graphiql: true,
}));

graphqlapp.listen(GRAPHQL_API_PORT);

console.log('Running a GraphQL API server at ' + SERVER_ADDRESS + ':' + GRAPHQL_API_PORT + '/graphql');

// readline
const readline = rl.default;

const rlp = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: true
});

let selected = 0;

const loadPrompt = () => {
	rlp.questionAsync(commands[selected].description + ': ').then(questionArgs => {
		console.log(checkCommandArgs(questionArgs));
		loadPrompt();
	});
}

loadPrompt();
