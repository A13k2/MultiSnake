// @ts-check
import React, { Component } from 'react';
import Snake from './Snake';
import Food from './Food';
import './App.css';
import firebase from './firebase.js';

const GAMESTATE = {
  PAUSED: 0,
  RUNNING: 1,
  MENU: 2,
  GAMEOVER: 3,
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
  direction: 'RIGHT',
  speed: 100,
  snakeDots: [[0, 0], [2, 0], [2, 2], [2, 4]],
  foodDot: getRandomCoordinates(),
};

const db = firebase.database();

class App extends Component {
  state = defaultState;

  componentDidMount() {
    setInterval(this.moveSnake, this.state.speed);
    document.onkeydown = this.onKeyDown;
    this.initDb();
  }

  initDb = () => {
    const lastActive = db.ref('last_active');
    lastActive.once('value', snapshot => {
      const now = new Date().getTime();
      if (!snapshot.val() || now - snapshot.val() > 1000 * 30) {
        lastActive.set(now);
        db.ref('direction').remove();
      }
      this.initPlayer();
    });
  };

  initPlayer = () => {
    var playerId = 0;
    db.ref('direction').once('value', snapshot => {
      playerId = snapshot.val() ? snapshot.val().length : 0;
      db.ref(`direction/${playerId}`).set('RIGHT');
      console.log('playerId: ', playerId);
      this.setState({ playerId });
    });

    db.ref('direction').on('value', snapshot => {
      console.log('player data change: ', snapshot.val());
    });
  };

  onDirectionChange = direction => {
    this.setState({ direction });
    db.ref(`direction/${this.state.playerId}`).set(direction);
  };

  onKeyDown = e => {
    e = e || window.event;
    switch (e.keyCode) {
      case 38:
        this.onDirectionChange('UP');
        break;
      case 40:
        this.onDirectionChange('DOWN');
        break;
      case 37:
        this.onDirectionChange('LEFT');
        break;
      case 39:
        this.onDirectionChange('RIGHT');
        break;
      case 32:
        this.togglePause();
        break;
    }
  };

  reset = () => {
    this.setState(defaultState);
  };

  togglePause = () => {
    let { gamestate } = this.state;
    if (gamestate === GAMESTATE.RUNNING) {
      gamestate = GAMESTATE.PAUSED;
    } else gamestate = GAMESTATE.RUNNING;
    this.setState({ gamestate });
  };

  moveSnake = () => {
    let { foodDot, gamestate } = this.state;

    if (gamestate === GAMESTATE.PAUSED) return;

    let dots = [...this.state.snakeDots];
    let head = dots[dots.length - 1];

    switch (this.state.direction) {
      case 'RIGHT':
        head = [head[0] + 2, head[1]];
        break;
      case 'LEFT':
        head = [head[0] - 2, head[1]];
        break;
      case 'DOWN':
        head = [head[0], head[1] + 2];
        break;
      case 'UP':
        head = [head[0], head[1] - 2];
        break;
    }
    if (this.checkFood(head, foodDot)) {
      foodDot = getRandomCoordinates();
    } else {
      dots.shift();
    }
    if (this.checkBorders(head)) {
      this.reset();
      return;
    }
    dots.push(head);
    if (this.checkGay(dots)) {
      this.reset();
      return;
    }
    this.setState({
      snakeDots: dots,
      foodDot: foodDot,
    });
  };

  checkGay = dots => {
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        if (dots[i][0] === dots[j][0] && dots[i][1] === dots[j][1]) {
          console.log('gay');
          return true;
        }
      }
    }
    return false;
  };

  checkFood = (head, foodDot) => {
    if (head[0] === foodDot[0] && head[1] === foodDot[1]) {
      return true;
    }
  };

  checkBorders = head => {
    if (head[0] === 0 || head[0] === 100 || head[1] === 0 || head[1] === 100) {
      return true;
    }
  };

  render() {
    return (
      <div className="game-area">
        <Snake snakeDots={this.state.snakeDots} />
        <Food dot={this.state.foodDot} />
      </div>
    );
  }
}

export default App;
