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

// database
const options = { 
	verbose: (message) => { logger.writeToLog(message, 4) } 
};
const db = new Database('store.db', options);

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

const setGrid = (x, y, i) => {
	map.grid[GRID_Y_MAX-y-1][x] = i;
}

const setPosition = (x, y, o) => {
	if(x >= GRID_X_MAX || x < 0) {
		return "x position is off map";
	} else if(y >= GRID_Y_MAX || y < 0) {
		return "y position is off map";
	} else if(regx_orientation.test(o) === false) {
		return "Orientation error, expected N S E or W";
	} else {
		setGrid(map.x, map.y, 0);
		setGrid(x, y, 1);
		map.x = x;
		map.y = y;
		map.o = o;
		console.log(map);
		return "Placed at x=" + map.x + " y=" + map.y + " o=" + map.o;
	}
}

const moveForward = () => {
	switch(map.o)
	{
		case 'N': 
			setPosition(map.x, map.y+1, map.o);
		break;

		case 'E': 
			setPosition(map.x+1, map.y, map.o);
		break;

		case 'S': 
			setPosition(map.x, map.y-1, map.o);
		break;

		case 'W': 
			setPosition(map.x-1, map.y, map.o);
		break;

		default: break;
	}
}

const processMovement = (m) => {
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

		case 'F':
			moveForward();
		break;

		default: break;
	}
	map.o = ORIENTATIONS[index];
}

const processCommand = (args) => {
	if(args.length === 3) {
		const posx = parseInt(args[0]);
		const posy = parseInt(args[1]);
		const o = args[2].substring(0, 1);
		return setPosition(posx, posy, o);
	} else {
		return "Missing args";
	}
}

const processMovementArgs = (args) => {
	if(args.length === 1) {
		const characters = args[0];
		for (let i = 0; i < characters.length; i++) {
			const char = characters.charAt(i);
			if(regx_movement.test(char)) {
				console.log("handle char " + char)
				processMovement(char);
			} else {
				console.log("error char " + char)
			}
		}
		return "Got args"
	} else {
		return "Missing args";
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
	{ command: "c", description: "command", syntax: "c x y o", func: (qargs) => [processCommand(qargs)] },
	{ command: "m", description: "movement", syntax: "m L", func: (qargs) => [processMovementArgs(qargs)] },
];

const findCommand = (qargs) => {
	if(qargs.length > 0) {
		const found = commands.find(element => element.command === qargs[0]);
		if(typeof found !== 'undefined') {
			qargs.shift();
			return found.func(qargs);
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
