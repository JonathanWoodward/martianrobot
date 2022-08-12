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
node index.js c 5 3
```

## Usage REST

To start the app with a position in the upper right

```bash
node index.js c 5 3
```

To change position

```
http://localhost/command/c%201%201
```

## Usage GraphQL

To start the app with a position in the upper right

```bash
node index.js c 5 3
```

To change position

```
http://localhost:4000/graphql?query=%7B%20%0A%20%20command(args%3A%20%22c%201%202%22)%20%0A%7D
```

## Project status

Incomplete
