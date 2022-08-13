## Martian Robots

The surface of Mars can be modelled by a rectangular grid around which robots are able to move according to instructions provided from Earth.

A robot position consists of a grid coordinate (a pair of integers: x-coordinate followed by y-coordinate) and an orientation (N, S, E, W for north, south, east, and west). A robot instruction is a string of the letters "L", "R", and "F" which represent, respectively,

* Left: the robot turns left 90 degrees and remains on the current grid point.
* Right: the robot turns right 90 degrees and remains on the current grid point.
* Forward: the robot moves forward one grid point in the direction of the current orientation and maintains the same orientation.

The direction North corresponds to the direction from grid point (x, y) to grid point (x, y+1).

There is also a possibility that additional command types may be required in the future and provision should be made for this.
Since the grid is rectangular and bounded (...yes Mars is a strange planet), a robot that moves "off" an edge of the grid is lost forever. However, lost robots leave a robot "scent" that prohibits future robots from dropping off the world at the same grid point. The scent is left at the last grid position the robot occupied before disappearing over the edge. An instruction to move "off" the world from a grid point from which a robot has been previously lost is simply ignored by the current robot.

## The input

The first line of input is the upper-right coordinates of the rectangular world, the lower-left coordinates are assumed to be 0, 0.
The remaining input consists of a sequence of robot positions and instructions (two lines per robot). A position consists of two integers specifying the initial coordinates of the robot and an orientation (N, S, E, W), all separated by whitespace on one line. A robot instruction is a string of the letters "L", "R", and "F" on one line.

Each robot is processed sequentially, i.e., finishes executing the robot instructions before the next robot begins execution.

The maximum value for any coordinate is 50.

All instruction strings will be less than 100 characters in length.

## The output

For each robot position/instruction in the input, the output should indicate the final grid position and orientation of the robot. If a robot falls off the edge of the grid the word "LOST" should be printed after the position and orientation.

### Sample input

5 3

1 1 E

RFRFRFRF

3 2 N

FRRFLLFFRRFLL

0 3 W

LLFFFRFLFL

### Sample output

1 1 E

3 3 N LOST

4 2 N

## Installation

Install node packages

```bash
npm install
```

Start the service

```bash
node index.js
```

## Usage CLI

To start the app with a position in the upper right

```bash
node index.js c 5 3 S
```
or
```bash
$ node index.js
Enter command: c 5 3 S
```
Result
```bash
[ '5 3 S' ]
```

To see where you are on the grid
```bash
Enter command: p
```
Result
```bash
[ 
  '00000S', 
  '000000', 
  '000000', 
  '000000' 
]
```

## Usage GraphQL

Open the GraphiQL playground in a web browser (tested in Chrome)

```
http://localhost:4000/graphql
```

Here you can execute queries and see the results

To print the grid
```
{ 
  command(args: "p") 
}
```
Results
```
{
  "data": {
    "command": [
      "00000S",
      "000000",
      "000000",
      "000000"
    ]
  }
}
```

To drop the robot on a position
```
{ 
  command(args: "c 5 3 S") 
}
```
Results
```
{
  "data": {
    "command": [
      "5 3 S"
    ]
  }
}
```

To make a movement
```
{ 
  command(args: "m FFRFF") 
}
```
Results
```
{
  "data": {
    "command": [
      "5 2 S",
      "5 1 S",
      "5 1 W",
      "4 1 W",
      "3 1 W"
    ]
  }
}
```

To list previous inputs
```
{ 
  command(args: "l") 
}
```
Results
```
{
  "data": {
    "command": [
      "2022-08-13 13:54:05 1: l ",
      "2022-08-13 13:54:30 2: c 2 2 N",
      "2022-08-13 13:54:39 3: m FFRFF",
      "2022-08-13 13:54:55 4: l "
    ]
  }
}
```

To see the output of the input
```
{ 
  command(args: "o 3") 
}
```
Results
```
{
  "data": {
    "command": [
      "4 3 E"
    ]
  }
}
```

To see the movement history of the input
```
{ 
  command(args: "r 3") 
}
```
Results
```
{
  "data": {
    "command": [
      "2 3 N",
      "2 4 N LOST",
      "2 3 E",
      "3 3 E",
      "4 3 E"
    ]
  }
}
```

## Usage REST

To change position
```
http://localhost/command/c%205%203%20S
```
Result
```
["5 3 S"]
```

To print the grid
```
http://localhost/command/p
```
Result
```
["00000S","000000","000000","000000"]
```

# Commands

```bash
Enter command: h
[
  'h help - usage: h',
  'c Command drop robot on the grid - usage: c x y o',
  'm Make movements on the grid - usage: m LFRF',
  'l List the input history - usage: l',
  'r Show results by input id - usage: r id',
  'p Print grid - usage: p',
  'o Get the output by input id - usage: o id'
]
```

## Project status

Developed and tested with node v16.13.0

Further work to be added
* Jest testing.
* Decide if to terminate when LOST and wait for robot to be placed again before accepting movements.
* Deploy it somewhere (heroku / your kubernetes cluster / any otherinteresting place).
* Split index.js out into modules.
* Add instructions for docker and test on Linux VM.
* Make a canvas user interface to show the robot moving rounf the grid.
* Add multiple robots onto the grid and allow selecting which robot is in use.
