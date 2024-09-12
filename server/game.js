class TugOfWarGame {
  constructor() {
    this.reset();
  }

  reset() {
    this.leftTeam = new Set();
    this.rightTeam = new Set();
    this.ropePosition = 50; // Center position
    this.gameState = "waiting";
    this.winThreshold = 20; // Win if rope moves 20 units to either side
  }

  addPlayer(playerId, side) {
    if (side === "left") {
      this.leftTeam.add(playerId);
    } else {
      this.rightTeam.add(playerId);
    }

    if (this.leftTeam.size > 0 && this.rightTeam.size > 0) {
      this.gameState = "starting";
    }
  }

  removePlayer(playerId) {
    this.leftTeam.delete(playerId);
    this.rightTeam.delete(playerId);

    if (this.leftTeam.size === 0 || this.rightTeam.size === 0) {
      this.gameState = "waiting";
    }
  }

  pull(side) {
    const pullStrength = 0.5;
    if (side === "left") {
      this.ropePosition -= pullStrength;
    } else {
      this.ropePosition += pullStrength;
    }

    if (this.ropePosition <= 50 - this.winThreshold) {
      this.gameState = "leftWin";
    } else if (this.ropePosition >= 50 + this.winThreshold) {
      this.gameState = "rightWin";
    }
  }

  getGameState() {
    return {
      leftTeamSize: this.leftTeam.size,
      rightTeamSize: this.rightTeam.size,
      ropePosition: this.ropePosition,
      gameState: this.gameState,
    };
  }
}

module.exports = TugOfWarGame;
