const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class DivinerPrediction extends Card {
  constructor(role) {
    super(role);

    role.predictedCorrect = false;
    
    this.meetings = {
      "Diviner Prediction": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          run: function () {
            this.actor.role.predictedVote = this.target;
          },
        },
      },
    };

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        if (aliveCount <= 1 && this.player.alive)
          winners.addPlayer(this.player, this.name);
      },
    };

    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.alive) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        
        if (!this.predictedCorrect) {
          this.player.removeEffect("ExtraLife");
          delete this.predictedVote;
        } else if (this.predictedCorrect)  {
          this.player.giveEffect("ExtraLife");
        }
      },
      death: function (player, killer, deathType) {
        if (
          player === this.predictedVote &&
          deathType === "condemn" &&
          this.player.alive
        ) {
          this.predictedCorrect = true;
          this.player.queueAlert(
            `The Village has condemned ${this.predictedVote.name} to death, allowing you to use your Divining Rod to find the orichalcum to empower your runestone.`
          );
        }
      },
      immune: function (action) {
        if (action.target !== this.player) {
          return;
        }

        if (action.hasLabel("condemn")) {
          let action = new Action({
            actor: this.player,
            target: this.predictedVote,
            game: this.player.game,
            power: 5,
            labels: ["kill", "condemn", "overthrow", "diviner"],
            run: function () {
              if (this.dominates()) this.target.kill("condemn", this.actor);
              this.predictedCorrect = false;
            },
          });
          action.do();
        } else if (action.hasLabel("kill")) {
          let action = new Action({
            actor: this.player,
            target: this.predictedVote,
            game: this.player.game,
            power: 5,
            labels: ["kill", "diviner"],
            run: function () {
              if (this.dominates()) this.target.kill("basic", this.actor);
              this.predictedCorrect = false;
            },
          });
          action.do();
        }
      },
    };
  }
};
