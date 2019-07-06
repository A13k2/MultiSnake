// @ts-check
import React, { Component } from 'react';
import Snake from './Snake';
import Food from './Food';
import './App.css';
import firebase from './firebase.js';

const KEY = {
  UP: 38,
  DOWN: 40,
  LEFT: 37,
  RIGHT: 39,
  SPACE: 32,
};

const DIRECTIONS = {
  LEFT: 0,
  RIGHT: 1,
  UP: 2,
  DOWN: 3,
};

const GAMESTATE = {
  PAUSED: 0,
  RUNNING: 1,
  MENU: 2,
  GAMEOVER: 3,
};

const STARTING_POSITIONS = {
  0: {
    alive: true,
    color: 'green',
    direction: DIRECTIONS.RIGHT,
    dots: [[2, 2], [4, 2]]
  },
  1: {
    alive: true,
    color: 'blue',
    direction: DIRECTIONS.LEFT,
    dots: [[92, 92], [94, 92]]
  },
  2: {
    alive: true,
    color: 'green',
    direction: DIRECTIONS.DOWN,
    dots: [[92, 2], [94, 2]]
  },
  3: {
    alive: true,
    color: 'purple',
    direction: DIRECTIONS.UP,
    dots: [[2, 92], [4, 92]]
  },
};

const getRandomCoordinates = () => {
  let min = 1;
  let max = 98;
  let x = Math.floor((Math.random() * (max - min + 1) + min) / 2) * 2;
  let y = Math.floor((Math.random() * (max - min + 1) + min) / 2) * 2;
  return [x, y];
};

const defaultState = {
  gamestate: GAMESTATE.PAUSED,
  speed: 100,
  snake: null,
  otherSnakes: [],
  foodDot: [],
};

const db = firebase.database();

class App extends Component {
  state = {
    ...defaultState,
    context: null
  };

  componentDidMount() {
    setInterval(this.moveSnake, this.state.speed);
    document.onkeydown = this.onKeyDown;
    this.initDb();
    const context = this.refs.canvas.getContext('2d');
    this.setState({ context: context });
  }

  initDb = () => {
    const lastActive = db.ref('last_active');
    lastActive.once('value', snapshot => {
      const now = new Date().getTime();
      if (!snapshot.val() || now - snapshot.val() > 1000 * 30) {
        lastActive.set(now);
        db.ref('snakeStates').remove();
      }
      this.initPlayer();
    });
  };

  initPlayer = () => {
    var id = 0;
    db.ref('snakeStates').once('value', snapshot => {
      id = snapshot.val() ? snapshot.val().length : 0;
      db.ref(`snakeStates/${id}`).set({
        snake: {
          ...STARTING_POSITIONS[id],
          id
        },
      });
      console.log('playerId: ', id);
      this.setState({
        snake: {
          ...STARTING_POSITIONS[id],
          id
        },
      });
    });
    db.ref('snakeStates').on('value', snapshot => {
      let snakeData = snapshot.val();
      this.checkGameOver(snakeData);
      this.setState({ otherSnakes: snakeData });
    });
    db.ref('gamestate').on('value', snapshot => {
      this.setState({ gamestate: snapshot.val() });
    });
    db.ref('foodDot').on('value', snapshot => {
      if (snapshot.exists()) {
        this.setState({ foodDot: snapshot.val() });
      } else {
        let foodDot = getRandomCoordinates()
        this.setState({ foodDot: foodDot });
        db.ref('foodDot').set(foodDot);
      }
    });
  };

  getScore = snake => {
    return snake.dots.length;
  };

  checkGameOver = snakeData => {
    const { snake } = this.state;
    if (!snake || !snakeData) return; // Check if Player is initalized and has a snake
    let gameOver = false;
    if (snakeData.length === 1 && !snake.alive) {
      gameOver = true;
    }
    if (snakeData.length > 1) {
      let countAlive = 0;
      let aliveSnake = null;
      let scores = [];
      snakeData.forEach(snakeIndex => {
        scores.push(snakeIndex.snake.dots.length);
        if (snakeIndex.snake.alive) {
          countAlive += 1;
          aliveSnake = snakeIndex.snake;
        }
      });
      if (countAlive === 1) {
        console.log(Math.max(...scores));
        if (Math.max(...scores) === scores[aliveSnake.id]) {
          gameOver = true;
        }
      } else if (countAlive === 0) gameOver = true;
    }
    if (gameOver) {
      this.setState({ gamestate: GAMESTATE.GAMEOVER });
      db.ref('gamestate').set(GAMESTATE.GAMEOVER);
    }
  };


  onDirectionChange = direction => {
    const { snake } = this.state;
    this.setState({
      snake: {
        ...snake,
        direction
      }
    });
  };

  onKeyDown = e => {
    e = e || window.event;
    const { snake: { direction }} = this.state;
    switch (e.keyCode) {
      case KEY.UP:
        if (direction !== DIRECTIONS.DOWN) {
          this.onDirectionChange(DIRECTIONS.UP);
        }
        break;
      case KEY.DOWN:
        if (direction !== DIRECTIONS.UP) {
          this.onDirectionChange(DIRECTIONS.DOWN);
        }
        break;
      case KEY.LEFT:
        if (direction !== DIRECTIONS.RIGHT) {
          this.onDirectionChange(DIRECTIONS.LEFT);
        }
        break;
      case KEY.RIGHT:
        if (direction !== DIRECTIONS.LEFT) {
          this.onDirectionChange(DIRECTIONS.RIGHT);
        }
        break;
      case KEY.SPACE:
        this.togglePause();
        break;
    }
  };

  togglePause = () => {
    let { gamestate } = this.state;
    if (gamestate === GAMESTATE.RUNNING) {
      gamestate = GAMESTATE.PAUSED;
    } else if (gamestate === GAMESTATE.GAMEOVER) {
      this.setState(defaultState);
      return;
    } else gamestate = GAMESTATE.RUNNING;
    this.setState({ gamestate });
    db.ref(`gamestate`).set(gamestate);
  };

  moveSnake = () => {
    let { foodDot, gamestate, snake } = this.state;
    if (snake === null) {
      console.log('No Snake.');
      return;
    }
    let { alive } = snake;

    if (gamestate === GAMESTATE.PAUSED) return;
    if (gamestate === GAMESTATE.GAMEOVER) return;
    if (!alive) return;

    let dots = [...snake.dots];
    let head = dots[dots.length - 1];

    switch (snake.direction) {
      case DIRECTIONS.RIGHT:
        head = [head[0] + 2, head[1]];
        break;
      case DIRECTIONS.LEFT:
        head = [head[0] - 2, head[1]];
        break;
      case DIRECTIONS.DOWN:
        head = [head[0], head[1] + 2];
        break;
      case DIRECTIONS.UP:
        head = [head[0], head[1] - 2];
        break;
    }
    if (this.checkFood(head, foodDot)) {
      // TODO: Check if new food coordinate is inside of a snake...
      foodDot = getRandomCoordinates();
      this.setState({
        foodDot,
      });
      db.ref('foodDot').set(foodDot);
    } else {
      dots.shift();
    }
    dots.push(head);
    // TODO: Refactor like next 30 lines.... Looks bad
    if (this.checkSelfGay(dots) || this.checkBorders(head) || this.checkOthersGay(head)) {
      alive = false;
      this.setState({
        snake: {
          ...snake,
          alive,
        }
      });
      db.ref(`snakeStates/${this.state.snake.id}`).set({
        snake: {
          ...snake,
          alive,
        }
      });
      return;
    } else {
      this.setState({
        snake: {
          ...snake,
          dots,
        }
      });
      db.ref(`snakeStates/${this.state.snake.id}`).set({
        snake: {
          ...snake,
          dots,
        }
      });
    }
  };

  checkSelfGay = (dots) => {
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        if (dots[i][0] === dots[j][0] && dots[i][1] === dots[j][1]) {
          return true;
        }
      }
    }
    return false;
  };

  checkOthersGay = (head) => {
    const { otherSnakes, snake: { id } } = this.state;
    let gay = false;
    otherSnakes.forEach((other) => {
      if (other.snake.id != id) {
        other.snake.dots.forEach((dot) => {
          if (head[0] === dot[0] && head[1] === dot[1]) {
            gay = true;
          }
        })
      }
    });
    return gay;
  };

  checkFood = (head, foodDot) => {
    if (head[0] === foodDot[0] && head[1] === foodDot[1]) {
      return true;
    }
  };

  checkBorders = (head) => {
    if (head[0] === -2 || head[0] === 100 || head[1] === -2 || head[1] === 100) {
      return true;
    }
  };

  display = () => {
    const { gamestate } = this.state;
    let message;
    switch (gamestate) {
      case GAMESTATE.RUNNING:
        return;
      case GAMESTATE.GAMEOVER:
        message = (<p>Game Over.</p>);
        break;
      case GAMESTATE.PAUSED:
        message = (<p>Game Paused</p>);
        break;
      default:
        return;
    }
    return (
      <div className="endgame">
        {message}
        <p>Press Space to Start again.</p>
      </div>
    )
  };

  resetFirebase = () => {
    db.ref('snakeStates').remove()
      .then(function () {
        console.log("Remove succeeded.")
      })
      .catch(function (error) {
        console.log("Remove failed: " + error.message)
      });
    db.ref('gamestate').set(GAMESTATE.PAUSED);
    this.setState({ snake: null });
    this.initPlayer();
  };

  render() {
    const { snake, otherSnakes } = this.state;
    let endgame = this.display();
    let snakeDisplay;
    let otherSnakesDisplay;
    if (snake) {
      snakeDisplay = (
        <Snake key={this.state.snake.id} snakeDots={this.state.snake.dots} color={snake.color} />);
      if (otherSnakes) {
        otherSnakesDisplay = otherSnakes.map((OneOfTheOtherSnakes) => {
            const currentSnake = OneOfTheOtherSnakes.snake;
            if (OneOfTheOtherSnakes.snake.id !== snake.id) {
              return (
                <Snake key={currentSnake.id} snakeDots={currentSnake.dots} color={currentSnake.color} />
              )
            }
          }
        )
      }
    }
    return (
      <div>
        <div className="game-area">
          {endgame}
          {snakeDisplay}
          {otherSnakesDisplay}
          <Food dot={this.state.foodDot} />
          <canvas ref='canvas' />
        </div>
        <button onClick={this.resetFirebase}>
          Reset
        </button>
      </div>
    )
  }
}

export default App;
