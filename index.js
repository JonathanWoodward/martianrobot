import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';
import rl from 'readline-promise';
import Database from 'better-sqlite3';

// args
const myArgs = process.argv.slice(2);

// constants
const REST_API_PORT = 80;
const GRAPHQL_API_PORT = 4000;
const GRID_X_MAX = 6;
const GRID_Y_MAX = 4;


// database
const options = { 
	verbose: (message) => { logger.writeToLog(message, 4) } 
};
const db = new Database('store.db', options);

// variables

let map = {
	grid: new Array(GRID_Y_MAX).fill(0),
	x: 0,
	y: 0
}

for (var y = 0; y < GRID_Y_MAX; y++) {
  map.grid[y] = new Array(GRID_X_MAX);
  map.grid[y].fill(0);
}

console.log(myArgs);

const setGrid = (x, y, i) => {
	map.grid[GRID_Y_MAX-y-1][x] = i;
}

const setPosition = (x, y) => {
	if(x >= GRID_X_MAX) {
		console.log("x is off map");
	} else if(y >= GRID_Y_MAX) {
		console.log("y is off map");
	} else {
		setGrid(map.x, map.y, 0);
		setGrid(x, y, 1);
		map.x = x;
		map.y = y;
		console.log(map);
	}
}

const checkArgs = (args) => {
	if(args.length === 2) {
		const posx = parseInt(args[0]);
		const posy = parseInt(args[1]);
		setPosition(posx, posy);
	} else {
		setPosition(map.x, map.y);
	}
}

const commands = [
	{ command: "", description: "Enter command", syntax: "", func: () => {} },
	{ command: "h", description: "help", syntax: "h", func: () => { commands.forEach(c => { if(c.command.length > 0) { console.log(c.command + ' ' + c.description + ' usage: ' + c.syntax) } } ) } },
	{ command: "c", description: "command", syntax: "c x y", func: (qargs) => { checkArgs(qargs); } },
];

const findCommand = (qargs) => {
	if(qargs.length > 0) {
		const found = commands.find(element => element.command === qargs[0]);
		if(typeof found !== 'undefined') {
			qargs.shift();
			found.func(qargs);
		} else {
			console.log("Command not found!");
		}
	}
}

const checkCommandArgs = (commandArgs) => {
	const qargs = commandArgs.split(/(\s+)/).filter( e => e.trim().length > 0);
	findCommand(qargs);
}

findCommand(myArgs);

// rest
const restapp = express();

restapp.get('/', (req, res) => {
  return res.send('movement');
});

restapp.get('/command/:args', (req, res) => {
	const args = req.params.args
	console.log(args);
	checkCommandArgs(args);
	return res.send('movement');
});


restapp.listen(REST_API_PORT);

console.log('Running a REST API server at http://localhost:' + REST_API_PORT);

// graphql
const graphqlapp = express();

const schema = buildSchema(`
  type Query {
    command(args: String): String
  }
`);

const root = {
	command: ({args}) => {
		console.log(args);
		checkCommandArgs(args);
		return 'You moved!';
	},
};

graphqlapp.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));

graphqlapp.listen(GRAPHQL_API_PORT);

console.log('Running a GraphQL API server at http://localhost:' + GRAPHQL_API_PORT + '/graphql');

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
		checkCommandArgs(questionArgs);
		loadPrompt();
	});
}

loadPrompt();

