"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      playerCards: [],
      playerlist: [],
      // 初始化playerlist
      selectedCard: null,
      // 选中的单张牌
      gameStatus: "waiting",
      // waiting, playing, ended
      gamePiles: {
        hearts: { suit: "hearts", count: 0, topCard: null, cards: [] },
        spades: { suit: "spades", count: 0, topCard: null, cards: [] },
        diamonds: { suit: "diamonds", count: 0, topCard: null, cards: [] },
        clubs: { suit: "clubs", count: 0, topCard: null, cards: [] }
      },
      // 新增数据字段
      deductedCards: [],
      // 扣牌记录
      gameRounds: 0,
      // 游戏回合数
      aiPlayCount: 0,
      // AI出牌次数
      remainingAIPlayers: 3,
      // 剩余AI玩家
      aiThinkTime: 0,
      // AI思考时间
      currentPlayer: null,
      // 当前玩家
      isPlayerTurn: false,
      // 是否是玩家回合
      isAIPlayerTurn: false,
      // 是否是AI回合
      scores: {
        player: { total: 0, penalty: 0, status: "playing" },
        ai1: { total: 0, penalty: 0, status: "playing" },
        ai2: { total: 0, penalty: 0, status: "playing" },
        ai3: { total: 0, penalty: 0, status: "playing" }
      },
      aiPlayers: [
        { name: "AI玩家1", cards: 13, isThinking: false, level: 3, handCards: [], status: "playing" },
        { name: "AI玩家2", cards: 13, isThinking: false, level: 2, handCards: [], status: "playing" },
        { name: "AI玩家3", cards: 13, isThinking: false, level: 1, handCards: [], status: "playing" }
      ],
      canbutton: true,
      // 控制按钮状态
      canPass: false,
      // 是否可以Pass
      passHint: ""
      // Pass提示
    };
  },
  methods: {},
  onLoad() {
    this.initGame();
  },
  methods: {
    // 返回菜单
    goBack() {
      common_vendor.index.navigateTo({
        url: "/pages/menu/menu"
      });
    },
    // 初始化游戏
    initGame() {
      const suits = ["spades", "hearts", "clubs", "diamonds"];
      const ranks = ["K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2", "A"];
      let deck = [];
      suits.forEach((suit) => {
        ranks.forEach((rank) => {
          deck.push({
            id: `${suit}-${rank}`,
            suit,
            rank,
            color: suit === "hearts" || suit === "diamonds" ? "red" : "black",
            value: this.getCardValue(rank)
          });
        });
      });
      const shuffleDeck = (deck2) => {
        for (let i = deck2.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [deck2[i], deck2[j]] = [deck2[j], deck2[i]];
        }
        return deck2;
      };
      deck = shuffleDeck(deck);
      this.playerCards = deck.slice(0, 13).sort(this.sortCards);
      this.aiPlayers = [
        { name: "AI玩家1", cards: 13, isThinking: false, level: 3, handCards: deck.slice(13, 26).sort(this.sortCards) },
        { name: "AI玩家2", cards: 13, isThinking: false, level: 2, handCards: deck.slice(26, 39).sort(this.sortCards) },
        { name: "AI玩家3", cards: 13, isThinking: false, level: 1, handCards: deck.slice(39, 52).sort(this.sortCards) }
      ];
      this.gameStatus = "waitingFirstPlay";
      this.currentPlayer = this.findSpade7Holder();
      this.isPlayerTurn = this.currentPlayer === "player";
      this.isAIPlayerTurn = !this.isPlayerTurn;
      this.gamePiles = {
        spades: { suit: "spades", count: 0, topCard: null, cards: [] },
        hearts: { suit: "hearts", count: 0, topCard: null, cards: [] },
        clubs: { suit: "clubs", count: 0, topCard: null, cards: [] },
        diamonds: { suit: "diamonds", count: 0, topCard: null, cards: [] }
      };
      this.scores = {
        player: { total: 0, penalty: 0, status: "playing" },
        ai1: { total: 0, penalty: 0, status: "playing" },
        ai2: { total: 0, penalty: 0, status: "playing" },
        ai3: { total: 0, penalty: 0, status: "playing" }
      };
      common_vendor.index.showToast({
        title: "游戏开始！每人13张牌",
        icon: "success",
        duration: 2e3
      });
    },
    // 获取牌面分值
    getCardValue(rank) {
      const values = {
        "K": 13,
        "Q": 12,
        "J": 11,
        "10": 10,
        "9": 9,
        "8": 8,
        "7": 7,
        "6": 6,
        "5": 5,
        "4": 4,
        "3": 3,
        "2": 2,
        "A": 1
      };
      return values[rank] || 0;
    },
    // 排序牌组（按花色和大小）
    sortCards(a, b) {
      const suitOrder = { "spades": 0, "hearts": 1, "clubs": 2, "diamonds": 3 };
      const rankOrder = { "K": 0, "Q": 1, "J": 2, "10": 3, "9": 4, "8": 5, "7": 6, "6": 7, "5": 8, "4": 9, "3": 10, "2": 11, "A": 12 };
      if (suitOrder[a.suit] !== suitOrder[b.suit]) {
        return suitOrder[a.suit] - suitOrder[b.suit];
      }
      return rankOrder[a.rank] - rankOrder[b.rank];
    },
    // 查找黑桃7持有者
    findSpade7Holder() {
      if (this.playerCards.some((card) => card.suit === "spades" && card.rank === "7")) {
        return "player";
      }
      for (let i = 0; i < this.aiPlayers.length; i++) {
        if (this.aiPlayers[i].handCards.some((card) => card.suit === "spades" && card.rank === "7")) {
          return `ai${i + 1}`;
        }
      }
      return "player";
    },
    // 检查是否为活牌
    isActiveCard(card) {
      if (card.rank === "7")
        return true;
      const pile = this.gamePiles[card.suit];
      if (!pile.topCard)
        return false;
      const currentRank = pile.topCard.rank;
      const rankOrder = ["K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2", "A"];
      const currentIndex = rankOrder.indexOf(currentRank);
      const cardIndex = rankOrder.indexOf(card.rank);
      return Math.abs(currentIndex - cardIndex) === 1;
    },
    // 获取活牌列表
    getActiveCards(cards) {
      return cards.filter((card) => this.isActiveCard(card));
    },
    // 开始游戏
    startAIGame() {
      this.initGame();
    },
    // 重新开始游戏
    restartAIGame() {
      this.initGame();
    },
    getSuitSymbol(suit) {
      switch (suit) {
        case "hearts":
          return "♥";
        case "spades":
          return "♠";
        case "clubs":
          return "♣";
        case "diamonds":
          return "♦";
        default:
          return suit;
      }
    },
    // 选择单张牌
    selectCard(card) {
      if (this.gameStatus === "waitingFirstPlay") {
        if (card.suit !== "spades" || card.rank !== "7") {
          common_vendor.index.showToast({
            title: "首出必须是黑桃7",
            icon: "none",
            duration: 2e3
          });
          return;
        }
      } else {
        const activeCards = this.getActiveCards(this.playerCards);
        if (activeCards.length > 0 && !activeCards.some((c) => c.id === card.id)) {
          common_vendor.index.showToast({
            title: "请先出活牌",
            icon: "none",
            duration: 2e3
          });
          return;
        }
      }
      if (this.selectedCard && this.selectedCard.id === card.id) {
        this.selectedCard = null;
      } else {
        this.selectedCard = card;
      }
      this.updatePassButton();
    },
    // 取消选择
    clearSelection() {
      this.selectedCard = null;
    },
    // 出牌
    playCard() {
      if (!this.selectedCard) {
        common_vendor.index.showToast({
          title: "请先选择要出的牌",
          icon: "none",
          duration: 2e3
        });
        return;
      }
      if (this.gameStatus === "waitingFirstPlay") {
        if (this.selectedCard.suit !== "spades" || this.selectedCard.rank !== "7") {
          common_vendor.index.showToast({
            title: "首出必须是黑桃7",
            icon: "none",
            duration: 2e3
          });
          return;
        }
        this.gameStatus = "playing";
      }
      const pile = this.gamePiles[this.selectedCard.suit];
      pile.cards.push({
        card: this.selectedCard,
        playedBy: "player"
      });
      pile.count++;
      pile.topCard = this.selectedCard;
      this.playerCards = this.playerCards.filter((card) => card.id !== this.selectedCard.id);
      this.selectedCard = null;
      if (this.playerCards.length === 0) {
        this.endGame("player");
        return;
      }
      this.isPlayerTurn = false;
      this.isAIPlayerTurn = true;
      setTimeout(() => {
        this.aiPlay();
      }, 1e3);
      common_vendor.index.showToast({
        title: "出牌成功",
        icon: "success",
        duration: 2e3
      });
    },
    // 更新Pass按钮状态
    updatePassButton() {
      const activeCards = this.getActiveCards(this.playerCards);
      this.canPass = activeCards.length === 0;
      this.passHint = activeCards.length > 0 ? "您还有活牌可出" : "可以扣牌";
    },
    // 扣牌（Pass）
    passTurn() {
      if (!this.canPass) {
        common_vendor.index.showToast({
          title: "您还有活牌可出",
          icon: "none",
          duration: 2e3
        });
        return;
      }
      const suitsOrder = ["spades", "hearts", "clubs", "diamonds"];
      const ranksOrder = ["K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2", "A"];
      let cardToPenalty = null;
      for (const suit of suitsOrder) {
        const suitCards = this.playerCards.filter((card) => card.suit === suit);
        if (suitCards.length > 0) {
          for (const rank of ranksOrder) {
            const card = suitCards.find((c) => c.rank === rank);
            if (card) {
              cardToPenalty = card;
              break;
            }
          }
          if (cardToPenalty)
            break;
        }
      }
      if (!cardToPenalty) {
        cardToPenalty = this.playerCards[0];
      }
      this.scores.player.penalty += cardToPenalty.value;
      this.deductedCards.push(cardToPenalty);
      this.playerCards = this.playerCards.filter((card) => card.id !== cardToPenalty.id);
      if (this.playerCards.length === 0) {
        this.endGame("player");
        return;
      }
      this.isPlayerTurn = false;
      this.isAIPlayerTurn = true;
      setTimeout(() => {
        this.aiPlay();
      }, 1e3);
      common_vendor.index.showToast({
        title: `扣牌成功: ${cardToPenalty.rank}${this.getSuitSymbol(cardToPenalty.suit)} (${cardToPenalty.value}分)`,
        icon: "none",
        duration: 2e3
      });
    },
    // 扣牌（旧方法，保持兼容性）
    penaltyCard() {
      if (this.getActiveCards(this.playerCards).length > 0) {
        common_vendor.index.showToast({
          title: "您还有活牌可出",
          icon: "none",
          duration: 2e3
        });
        return;
      }
      const suitsOrder = ["spades", "hearts", "clubs", "diamonds"];
      const ranksOrder = ["K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2", "A"];
      let cardToPenalty = null;
      for (const suit of suitsOrder) {
        const suitCards = this.playerCards.filter((card) => card.suit === suit);
        if (suitCards.length > 0) {
          for (const rank of ranksOrder) {
            const card = suitCards.find((c) => c.rank === rank);
            if (card) {
              cardToPenalty = card;
              break;
            }
          }
          if (cardToPenalty)
            break;
        }
      }
      if (!cardToPenalty) {
        cardToPenalty = this.playerCards[0];
      }
      this.scores.player.penalty += cardToPenalty.value;
      this.playerCards = this.playerCards.filter((card) => card.id !== cardToPenalty.id);
      if (this.playerCards.length === 0) {
        this.endGame("player");
        return;
      }
      this.isPlayerTurn = false;
      this.isAIPlayerTurn = true;
      setTimeout(() => {
        this.aiPlay();
      }, 1e3);
      common_vendor.index.showToast({
        title: `扣牌成功: ${cardToPenalty.rank}${this.getSuitSymbol(cardToPenalty.suit)} (${cardToPenalty.value}分)`,
        icon: "none",
        duration: 2e3
      });
    },
    // AI出牌逻辑
    aiPlay() {
      const aiIndex = this.getCurrentAIIndex();
      if (aiIndex === -1) {
        this.endGame();
        return;
      }
      const currentAI = this.aiPlayers[aiIndex];
      currentAI.isThinking = true;
      setTimeout(() => {
        currentAI.isThinking = false;
        const activeCards = this.getActiveCards(currentAI.handCards);
        if (activeCards.length > 0) {
          const suitsOrder = ["spades", "hearts", "clubs", "diamonds"];
          const ranksOrder = ["K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2", "A"];
          let cardToPlay = null;
          for (const suit of suitsOrder) {
            const suitCards = activeCards.filter((card) => card.suit === suit);
            if (suitCards.length > 0) {
              for (const rank of ranksOrder) {
                const card = suitCards.find((c) => c.rank === rank);
                if (card) {
                  cardToPlay = card;
                  break;
                }
              }
              if (cardToPlay)
                break;
            }
          }
          if (cardToPlay) {
            const pile = this.gamePiles[cardToPlay.suit];
            pile.cards.push({
              card: cardToPlay,
              playedBy: currentAI.name
            });
            pile.count++;
            pile.topCard = cardToPlay;
            currentAI.handCards = currentAI.handCards.filter((card) => card.id !== cardToPlay.id);
            currentAI.cards--;
            this.aiPlayCount++;
            this.gameRounds++;
            common_vendor.index.showToast({
              title: `${currentAI.name} 出牌: ${cardToPlay.rank}${this.getSuitSymbol(cardToPlay.suit)}`,
              icon: "none",
              duration: 2e3
            });
          }
        } else {
          const suitsOrder = ["spades", "hearts", "clubs", "diamonds"];
          const ranksOrder = ["K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2", "A"];
          let cardToPenalty = null;
          for (const suit of suitsOrder) {
            const suitCards = currentAI.handCards.filter((card) => card.suit === suit);
            if (suitCards.length > 0) {
              for (const rank of ranksOrder) {
                const card = suitCards.find((c) => c.rank === rank);
                if (card) {
                  cardToPenalty = card;
                  break;
                }
              }
              if (cardToPenalty)
                break;
            }
          }
          if (cardToPenalty) {
            const aiKey = `ai${aiIndex + 1}`;
            this.scores[aiKey].penalty += cardToPenalty.value;
            currentAI.handCards = currentAI.handCards.filter((card) => card.id !== cardToPenalty.id);
            currentAI.cards--;
            common_vendor.index.showToast({
              title: `${currentAI.name} 扣牌: ${cardToPenalty.rank}${this.getSuitSymbol(cardToPenalty.suit)} (${cardToPenalty.value}分)`,
              icon: "none",
              duration: 2e3
            });
          }
        }
        if (currentAI.handCards.length === 0) {
          currentAI.status = "finished";
          this.remainingAIPlayers--;
          this.checkGameEnd();
          return;
        }
        this.nextTurn();
      }, 1500);
    },
    // 获取当前应该出牌的AI索引
    getCurrentAIIndex() {
      if (!this.currentPlayer || !this.currentPlayer.startsWith("ai")) {
        for (let i = 0; i < this.aiPlayers.length; i++) {
          if (this.aiPlayers[i].status === "playing") {
            return i;
          }
        }
        return -1;
      }
      const aiNumber = parseInt(this.currentPlayer.replace("ai", ""));
      const index = aiNumber - 1;
      if (index >= 0 && index < this.aiPlayers.length && this.aiPlayers[index].status === "playing") {
        return index;
      }
      for (let i = 0; i < this.aiPlayers.length; i++) {
        if (this.aiPlayers[i].status === "playing") {
          return i;
        }
      }
      return -1;
    },
    // 切换到下一个回合
    nextTurn() {
      this.currentPlayer = this.getNextPlayer();
      if (this.currentPlayer === "player") {
        this.isPlayerTurn = true;
        this.isAIPlayerTurn = false;
        this.updatePassButton();
      } else {
        this.isPlayerTurn = false;
        this.isAIPlayerTurn = true;
        setTimeout(() => {
          this.aiPlay();
        }, 1e3);
      }
    },
    // 检查游戏是否结束
    checkGameEnd() {
      if (this.playerCards.length === 0) {
        this.scores.player.status = "finished";
      } else {
        this.scores.player.status = "playing";
      }
      this.aiPlayers.forEach((ai, index) => {
        const aiKey = `ai${index + 1}`;
        if (ai.handCards.length === 0) {
          this.scores[aiKey].status = "finished";
        } else {
          this.scores[aiKey].status = "playing";
        }
      });
      const allPlayers = ["player", "ai1", "ai2", "ai3"];
      const playingPlayers = allPlayers.filter((p) => this.scores[p].status === "playing");
      if (playingPlayers.length <= 1) {
        const lastPlayer = playingPlayers.length === 1 ? playingPlayers[0] : null;
        this.endGame(lastPlayer);
      }
    },
    // 游戏结束
    endGame(lastPlayer) {
      this.gameStatus = "ended";
      this.calculateScores();
      let resultMessage = "游戏结束！";
      resultMessage += `玩家得分: ${this.scores.player.total}
`;
      this.aiPlayers.forEach((ai, index) => {
        resultMessage += `${ai.name}得分: ${this.scores[`ai${index + 1}`].total}
`;
      });
      common_vendor.index.showModal({
        title: "游戏结果",
        content: resultMessage,
        showCancel: false
      });
    },
    // 计算得分
    calculateScores() {
      const allPlayers = ["player", "ai1", "ai2", "ai3"];
      const finishedPlayers = allPlayers.filter((p) => this.scores[p].status === "finished");
      const playingPlayers = allPlayers.filter((p) => this.scores[p].status === "playing");
      const lastPlayer = this.getLastFinishedPlayer();
      const isLastCardSeven = this.checkLastCardIsSeven(lastPlayer);
      let multiplier = 1;
      if (finishedPlayers.length >= 3)
        multiplier = 8;
      else if (finishedPlayers.length >= 2)
        multiplier = 4;
      else if (finishedPlayers.length >= 1)
        multiplier = 2;
      if (isLastCardSeven) {
        multiplier = 8;
      }
      this.checkFourKBonus();
      allPlayers.forEach((player) => {
        if (this.scores[player].status === "finished") {
          const otherPenalty = playingPlayers.reduce((sum, p) => sum + this.scores[p].penalty, 0);
          this.scores[player].total = otherPenalty * multiplier;
        } else {
          this.scores[player].total = -this.scores[player].penalty * (allPlayers.length - 1);
        }
        const penalty = this.scores[player].penalty;
        if (penalty > 70) {
          this.scores[player].total *= 8;
        } else if (penalty > 50) {
          this.scores[player].total *= 4;
        } else if (penalty > 30) {
          this.scores[player].total *= 2;
        }
      });
    },
    // 获取最后出完牌的玩家
    getLastFinishedPlayer() {
      const allPlayers = ["player", "ai1", "ai2", "ai3"];
      return allPlayers.find((p) => this.scores[p].status === "finished");
    },
    // 检查最后一张牌是否为7
    checkLastCardIsSeven(player) {
      if (!player)
        return false;
      return false;
    },
    // 检查4个K补助
    checkFourKBonus() {
      const allPlayers = ["player", "ai1", "ai2", "ai3"];
      allPlayers.forEach((player) => {
        if (this.scores[player].status === "finished") {
          const hasFourK = this.checkPlayerHasFourK(player);
          if (hasFourK) {
            const otherPlayers = allPlayers.filter((p) => p !== player);
            otherPlayers.forEach((other) => {
              this.scores[other].total -= 1;
            });
            this.scores[player].total += 3;
          }
        }
      });
    },
    // 检查玩家是否有4个K
    checkPlayerHasFourK(player) {
      return false;
    },
    // 获取下一个玩家
    getNextPlayer() {
      const players = ["player", "ai1", "ai2", "ai3"];
      const currentIndex = players.indexOf(this.currentPlayer);
      const nextIndex = (currentIndex + 1) % players.length;
      return players[nextIndex];
    },
    // 显示提示信息
    showToast(message) {
      common_vendor.index.showToast({
        title: message,
        icon: "none",
        duration: 2e3
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    b: common_vendor.f($data.aiPlayers, (ai, index, i0) => {
      return {
        a: common_vendor.t(ai.name),
        b: common_vendor.t(ai.cards),
        c: common_vendor.t(ai.isThinking ? "思考中..." : "等待中"),
        d: ai.isThinking ? 1 : "",
        e: common_vendor.t(ai.level),
        f: index
      };
    }),
    c: common_vendor.o((...args) => _ctx.SynInformation && _ctx.SynInformation(...args)),
    d: !$data.canbutton,
    e: common_vendor.o((...args) => $options.startAIGame && $options.startAIGame(...args)),
    f: !$data.canbutton,
    g: common_vendor.o((...args) => $options.restartAIGame && $options.restartAIGame(...args)),
    h: $data.gameStatus !== "playing",
    i: $data.gameStatus === "playing" && $data.currentPlayer
  }, $data.gameStatus === "playing" && $data.currentPlayer ? common_vendor.e({
    j: _ctx.isYourTurn
  }, _ctx.isYourTurn ? {} : $data.isAIPlayerTurn ? {
    l: common_vendor.t($data.currentPlayer)
  } : {
    m: common_vendor.t($data.currentPlayer)
  }, {
    k: $data.isAIPlayerTurn,
    n: common_vendor.n(_ctx.isYourTurn ? "your-turn" : $data.isAIPlayerTurn ? "ai-turn" : "other-turn")
  }) : {}, {
    o: $data.gamePiles
  }, $data.gamePiles ? {
    p: common_vendor.f($data.gamePiles, (pile, suit, i0) => {
      return common_vendor.e({
        a: pile.cards && pile.cards.length > 0
      }, pile.cards && pile.cards.length > 0 ? common_vendor.e({
        b: common_vendor.t($options.getSuitSymbol(suit)),
        c: common_vendor.t(pile.count),
        d: common_vendor.f(pile.cards, (entry, index, i1) => {
          return {
            a: common_vendor.t(entry.card.rank),
            b: common_vendor.t($options.getSuitSymbol(entry.card.suit)),
            c: index,
            d: common_vendor.n("card-" + entry.card.suit),
            e: common_vendor.n(entry.card.rank === "7" ? "seven-card" : ""),
            f: index > 0 ? "-20px" : "0"
          };
        }),
        e: pile.playedBy
      }, pile.playedBy ? {
        f: common_vendor.t(pile.playedBy)
      } : {}) : {}, {
        g: suit
      });
    })
  } : {}, {
    q: common_vendor.t($data.playerlist.length),
    r: common_vendor.f($data.playerlist, (item, index, i0) => {
      return {
        a: common_vendor.t(index + 1),
        b: common_vendor.t(item.deviceId || item),
        c: index
      };
    }),
    s: $data.playerCards.length > 0
  }, $data.playerCards.length > 0 ? common_vendor.e({
    t: common_vendor.t($data.playerCards.length),
    v: $data.selectedCard
  }, $data.selectedCard ? common_vendor.e({
    w: common_vendor.t($data.selectedCard.rank),
    x: common_vendor.t($options.getSuitSymbol($data.selectedCard.suit)),
    y: common_vendor.n("card-" + $data.selectedCard.suit),
    z: common_vendor.o((...args) => $options.playCard && $options.playCard(...args)),
    A: common_vendor.o((...args) => $options.clearSelection && $options.clearSelection(...args)),
    B: _ctx.isYourTurn && $data.gameStatus === "playing"
  }, _ctx.isYourTurn && $data.gameStatus === "playing" ? common_vendor.e({
    C: common_vendor.o((...args) => $options.passTurn && $options.passTurn(...args)),
    D: !$data.canPass,
    E: !$data.canPass
  }, !$data.canPass ? {
    F: common_vendor.t($data.passHint)
  } : {}) : {}) : {}, {
    G: common_vendor.f($data.playerCards, (card, index, i0) => {
      return common_vendor.e({
        a: common_vendor.t(card.rank),
        b: common_vendor.t($options.getSuitSymbol(card.suit)),
        c: $data.selectedCard && $data.selectedCard.id === card.id
      }, $data.selectedCard && $data.selectedCard.id === card.id ? {} : {}, {
        d: common_vendor.n("card-" + card.suit),
        e: common_vendor.n($data.selectedCard && $data.selectedCard.id === card.id ? "selected" : ""),
        f: common_vendor.o(($event) => $options.selectCard(card), index),
        g: index
      });
    })
  }) : {}, {
    H: $data.gameStatus === "playing"
  }, $data.gameStatus === "playing" ? {
    I: common_vendor.t($data.gameRounds),
    J: common_vendor.t($data.aiPlayCount),
    K: common_vendor.t($data.remainingAIPlayers),
    L: common_vendor.t($data.aiThinkTime)
  } : {}, {
    M: $data.isAIPlayerTurn
  }, $data.isAIPlayerTurn ? {} : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/ai-battle/ai-battle.js.map
