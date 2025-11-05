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
      passHint: "",
      // Pass提示
      orderedSuits: ["spades", "hearts", "clubs", "diamonds"]
    };
  },
  onLoad() {
    this.resetGameState();
  },
  methods: {
    // 返回菜单
    goBack() {
      common_vendor.index.navigateTo({
        url: "/pages/menu/menu"
      });
    },
    // 重置游戏状态（页面加载时调用）
    resetGameState() {
      this.playerCards = [];
      this.selectedCard = null;
      this.gameStatus = "waiting";
      this.gamePiles = {
        hearts: { suit: "hearts", count: 0, topCard: null, cards: [] },
        spades: { suit: "spades", count: 0, topCard: null, cards: [] },
        diamonds: { suit: "diamonds", count: 0, topCard: null, cards: [] },
        clubs: { suit: "clubs", count: 0, topCard: null, cards: [] }
      };
      this.deductedCards = [];
      this.gameRounds = 0;
      this.aiPlayCount = 0;
      this.remainingAIPlayers = 3;
      this.aiThinkTime = 0;
      this.currentPlayer = null;
      this.isPlayerTurn = false;
      this.isAIPlayerTurn = false;
      this.scores = {
        player: { total: 0, penalty: 0, status: "waiting" },
        ai1: { total: 0, penalty: 0, status: "waiting" },
        ai2: { total: 0, penalty: 0, status: "waiting" },
        ai3: { total: 0, penalty: 0, status: "waiting" }
      };
      this.aiPlayers = [
        { name: "AI玩家1", cards: 0, isThinking: false, level: 3, handCards: [], status: "waiting" },
        { name: "AI玩家2", cards: 0, isThinking: false, level: 2, handCards: [], status: "waiting" },
        { name: "AI玩家3", cards: 0, isThinking: false, level: 1, handCards: [], status: "waiting" }
      ];
      this.canPass = false;
      this.passHint = "等待游戏开始";
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
        { name: "AI玩家1", cards: 13, isThinking: false, level: 3, handCards: deck.slice(13, 26).sort(this.sortCards), status: "playing" },
        { name: "AI玩家2", cards: 13, isThinking: false, level: 2, handCards: deck.slice(26, 39).sort(this.sortCards), status: "playing" },
        { name: "AI玩家3", cards: 13, isThinking: false, level: 1, handCards: deck.slice(39, 52).sort(this.sortCards), status: "playing" }
      ];
      this.gameStatus = "waitingFirstPlay";
      this.currentPlayer = this.findSpade7Holder();
      this.isPlayerTurn = this.currentPlayer === "player";
      this.isAIPlayerTurn = !this.isPlayerTurn;
      if (this.isAIPlayerTurn) {
        setTimeout(() => {
          this.aiPlay();
        }, 300);
      }
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
    // 排序牌组（按花色并按 A→K 升序）
    sortCards(a, b) {
      const suitOrder = { "spades": 0, "hearts": 1, "clubs": 2, "diamonds": 3 };
      const asc = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
      const rankOrder = asc.reduce((acc, r, i) => {
        acc[r] = i;
        return acc;
      }, {});
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
      const rankOrder = ["K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2", "A"];
      const pile = this.gamePiles[card.suit];
      if (!pile || !pile.cards || pile.cards.length === 0) {
        return card.rank === "7";
      }
      const playedIndices = pile.cards.map((entry) => rankOrder.indexOf(entry.card.rank)).filter((idx) => idx >= 0);
      if (playedIndices.length === 0) {
        return card.rank === "7";
      }
      const minIdx = Math.min(...playedIndices);
      const maxIdx = Math.max(...playedIndices);
      const cardIdx = rankOrder.indexOf(card.rank);
      return cardIdx === minIdx - 1 || cardIdx === maxIdx + 1;
    },
    // 获取活牌列表
    getActiveCards(cards) {
      return cards.filter((card) => this.isActiveCard(card));
    },
    // 按花色获取手牌
    getCardsBySuit(suit) {
      return this.playerCards.filter((card) => card.suit === suit).sort((a, b) => {
        const rankOrder = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
        return rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
      });
    },
    // 按花色获取手牌
    getCardsBySuit(suit) {
      return this.playerCards.filter((card) => card.suit === suit).sort((a, b) => {
        const rankOrder = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
        return rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
      });
    },
    // 开始游戏
    startAIGame() {
      this.canbutton = false;
      this.initGame();
      common_vendor.index.showToast({
        title: "游戏开始！正在发牌...",
        icon: "success",
        duration: 2e3
      });
      setTimeout(() => {
        this.gameStatus = "waitingFirstPlay";
        if (this.currentPlayer === "player") {
          common_vendor.index.showToast({
            title: "轮到您先出牌（黑桃7）",
            icon: "none",
            duration: 2e3
          });
        } else {
          common_vendor.index.showToast({
            title: "轮到AI先出牌",
            icon: "none",
            duration: 2e3
          });
        }
      }, 800);
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
    // 获取按 A→K 排序后的牌堆序列
    getPileCardsSorted(suit) {
      const asc = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
      const order = asc.reduce((acc, r, i) => {
        acc[r] = i;
        return acc;
      }, {});
      const pile = this.gamePiles[suit];
      if (!pile || !pile.cards)
        return [];
      return [...pile.cards].sort((e1, e2) => order[e1.card.rank] - order[e2.card.rank]);
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
      this.isPlayerTurn = false;
      this.isAIPlayerTurn = true;
      this.currentPlayer = this.getNextPlayer();
      setTimeout(() => {
        this.aiPlay();
      }, 500);
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
      this.isPlayerTurn = false;
      this.isAIPlayerTurn = true;
      this.currentPlayer = this.getNextPlayer();
      setTimeout(() => {
        this.aiPlay();
      }, 500);
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
      this.isPlayerTurn = false;
      this.isAIPlayerTurn = true;
      this.currentPlayer = this.getNextPlayer();
      setTimeout(() => {
        this.aiPlay();
      }, 500);
      common_vendor.index.showToast({
        title: `扣牌成功: ${cardToPenalty.rank}${this.getSuitSymbol(cardToPenalty.suit)} (${cardToPenalty.value}分)`,
        icon: "none",
        duration: 2e3
      });
    },
    // AI出牌逻辑
    aiPlay() {
      common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:789", "aiPlay called, isAIPlayerTurn:", this.isAIPlayerTurn, "currentPlayer:", this.currentPlayer);
      if (this.gameStatus === "ended" || this.gameStatus === "finished") {
        common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:793", "Game already ended, stopping AI play");
        return;
      }
      const aiIndex = this.getCurrentAIIndex();
      common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:799", "Found AI index:", aiIndex);
      if (aiIndex === -1) {
        common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:802", "No active AI found, checking game end");
        this.checkGameEnd();
        return;
      }
      const currentAI = this.aiPlayers[aiIndex];
      common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:808", "Current AI:", currentAI.name, "hand cards:", currentAI.handCards.length);
      if (currentAI.handCards.length === 0) {
        common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:812", "AI has no cards left, marking as finished");
        currentAI.status = "finished";
        this.remainingAIPlayers--;
        this.checkGameEnd();
        return;
      }
      currentAI.isThinking = true;
      setTimeout(() => {
        currentAI.isThinking = false;
        let cardToPlay = null;
        if (this.gameStatus === "waitingFirstPlay") {
          common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:829", "First play mode, looking for spade 7");
          const spade7 = currentAI.handCards.find((card) => card.suit === "spades" && card.rank === "7");
          if (spade7) {
            cardToPlay = spade7;
            this.gameStatus = "playing";
            common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:834", "Found spade 7, setting game status to playing");
          } else {
            cardToPlay = currentAI.handCards.find((card) => card.rank === "7");
            if (cardToPlay) {
              this.gameStatus = "playing";
              common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:840", "Found other 7, setting game status to playing");
            } else {
              common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:842", "No 7 found in AI hand, cannot make first play");
            }
          }
        } else {
          const activeCards = this.getActiveCards(currentAI.handCards);
          common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:848", "Active cards found:", activeCards.length);
          if (activeCards.length > 0) {
            const suitsOrder = ["spades", "hearts", "clubs", "diamonds"];
            const ranksOrder = ["K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2", "A"];
            for (const suit of suitsOrder) {
              const suitCards = activeCards.filter((card) => card.suit === suit);
              if (suitCards.length > 0) {
                for (const rank of ranksOrder) {
                  const card = suitCards.find((c) => c.rank === rank);
                  if (card) {
                    cardToPlay = card;
                    common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:862", "Found card to play:", card.rank, card.suit);
                    break;
                  }
                }
                if (cardToPlay)
                  break;
              }
            }
          } else {
            common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:870", "No active cards available");
          }
        }
        if (cardToPlay) {
          common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:875", "Playing card:", cardToPlay.rank, cardToPlay.suit);
          const pile = this.gamePiles[cardToPlay.suit];
          pile.cards.push({
            card: cardToPlay,
            playedBy: currentAI.name
          });
          pile.count++;
          pile.topCard = cardToPlay;
          currentAI.handCards = currentAI.handCards.filter((card) => card.id !== cardToPlay.id);
          currentAI.cards = currentAI.handCards.length;
          this.aiPlayCount++;
          this.gameRounds++;
          common_vendor.index.showToast({
            title: `${currentAI.name} 出牌: ${cardToPlay.rank}${this.getSuitSymbol(cardToPlay.suit)}`,
            icon: "none",
            duration: 2e3
          });
          if (currentAI.handCards.length === 0) {
            common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:902", "AI finished all cards");
            currentAI.status = "finished";
            this.remainingAIPlayers--;
            this.checkGameEnd();
            return;
          }
          this.checkGameEnd();
          this.nextTurn();
        } else {
          const activeCards = this.getActiveCards(currentAI.handCards);
          common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:918", "No card selected, checking active cards:", activeCards.length);
          if (activeCards.length === 0) {
            common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:922", "No active cards, AI will pass");
            common_vendor.index.showToast({
              title: `${currentAI.name} 选择过牌（没有活牌）`,
              icon: "none",
              duration: 2e3
            });
            const aiKey = `ai${aiIndex + 1}`;
            this.scores[aiKey].passCount = (this.scores[aiKey].passCount || 0) + 1;
            this.nextTurn();
            return;
          } else {
            common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:938", "Has active cards but no card selected, forcing penalty");
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
              common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:959", "Penalty card selected:", cardToPenalty.rank, cardToPenalty.suit);
              const aiKey = `ai${aiIndex + 1}`;
              this.scores[aiKey].penalty += cardToPenalty.value;
              currentAI.handCards = currentAI.handCards.filter((card) => card.id !== cardToPenalty.id);
              currentAI.cards = currentAI.handCards.length;
              common_vendor.index.showToast({
                title: `${currentAI.name} 扣牌: ${cardToPenalty.rank}${this.getSuitSymbol(cardToPenalty.suit)} (${cardToPenalty.value}分)`,
                icon: "none",
                duration: 2e3
              });
              if (currentAI.handCards.length === 0) {
                currentAI.status = "finished";
                this.remainingAIPlayers--;
                this.checkGameEnd();
                return;
              }
              this.checkGameEnd();
              this.nextTurn();
            } else {
              common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:990", "No penalty card found, passing");
              common_vendor.index.showToast({
                title: `${currentAI.name} 选择过牌`,
                icon: "none",
                duration: 2e3
              });
              this.nextTurn();
            }
          }
        }
      }, 500);
    },
    // 获取当前应该出牌的AI索引
    getCurrentAIIndex() {
      common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:1008", "getCurrentAIIndex called, currentPlayer:", this.currentPlayer);
      if (this.currentPlayer && this.currentPlayer.startsWith("ai")) {
        const aiNumber = parseInt(this.currentPlayer.replace("ai", ""));
        const index = aiNumber - 1;
        if (index >= 0 && index < this.aiPlayers.length && this.aiPlayers[index].status === "playing") {
          common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:1017", "Found AI at index:", index);
          return index;
        }
      }
      for (let i = 0; i < this.aiPlayers.length; i++) {
        if (this.aiPlayers[i].status === "playing") {
          common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:1025", "Found first active AI at index:", i);
          return i;
        }
      }
      common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:1030", "No active AI found");
      return -1;
    },
    // 切换到下一个回合
    nextTurn() {
      common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:1036", "nextTurn called, currentPlayer:", this.currentPlayer);
      if (this.gameStatus === "ended" || this.gameStatus === "finished") {
        common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:1040", "Game already ended, stopping turn switching");
        return;
      }
      this.currentPlayer = this.getNextPlayer();
      common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:1046", "Next player:", this.currentPlayer);
      if (this.currentPlayer === "player") {
        if (this.scores.player.status === "playing") {
          this.isPlayerTurn = true;
          this.isAIPlayerTurn = false;
          common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:1054", "Switched to player turn");
          this.updatePassButton();
        } else {
          common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:1060", "Player already finished, continuing to next turn");
          this.nextTurn();
        }
      } else {
        const aiIndex = this.getCurrentAIIndex();
        if (aiIndex !== -1) {
          this.isPlayerTurn = false;
          this.isAIPlayerTurn = true;
          common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:1070", "Switched to AI turn, starting AI play");
          setTimeout(() => {
            this.aiPlay();
          }, 300);
        } else {
          common_vendor.index.__f__("log", "at pages/ai-battle/ai-battle.vue:1078", "No active AI found, checking game end");
          this.checkGameEnd();
        }
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
        this.gameStatus = "finished";
        this.endGame(lastPlayer);
      }
    },
    // 游戏结束
    endGame(lastPlayer) {
      if (this.gameStatus !== "finished") {
        return;
      }
      this.gameStatus = "ended";
      this.calculateScores();
      let resultMessage = "游戏结束！";
      resultMessage += `玩家得分: ${this.scores.player.total}
`;
      this.aiPlayers.forEach((ai, index) => {
        resultMessage += `${ai.name}得分: ${this.scores[`ai${index + 1}`].total}
`;
      });
      if (lastPlayer) {
        const winnerName = lastPlayer === "player" ? "玩家" : this.aiPlayers[parseInt(lastPlayer.replace("ai", "")) - 1].name;
        resultMessage += `
获胜者: ${winnerName}`;
      } else {
        resultMessage += "游戏平局！";
      }
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
      let currentIndex = players.indexOf(this.currentPlayer);
      if (currentIndex === -1) {
        currentIndex = 0;
      }
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
    b: $data.gameStatus !== "waiting"
  }, $data.gameStatus !== "waiting" ? {
    c: common_vendor.f($data.aiPlayers, (ai, index, i0) => {
      return {
        a: common_vendor.t(ai.name),
        b: common_vendor.t(ai.cards),
        c: common_vendor.t(ai.isThinking ? "思考中..." : "等待中"),
        d: ai.isThinking ? 1 : "",
        e: common_vendor.t(ai.level),
        f: index
      };
    })
  } : {}, {
    d: common_vendor.o((...args) => _ctx.SynInformation && _ctx.SynInformation(...args)),
    e: !$data.canbutton,
    f: common_vendor.o((...args) => $options.startAIGame && $options.startAIGame(...args)),
    g: !$data.canbutton,
    h: common_vendor.o((...args) => $options.restartAIGame && $options.restartAIGame(...args)),
    i: $data.gameStatus !== "playing",
    j: $data.gameStatus !== "waiting" && $data.currentPlayer
  }, $data.gameStatus !== "waiting" && $data.currentPlayer ? common_vendor.e({
    k: $data.isPlayerTurn
  }, $data.isPlayerTurn ? {} : $data.isAIPlayerTurn ? {
    m: common_vendor.t($data.currentPlayer)
  } : {
    n: common_vendor.t($data.currentPlayer)
  }, {
    l: $data.isAIPlayerTurn,
    o: common_vendor.n($data.isPlayerTurn ? "your-turn" : $data.isAIPlayerTurn ? "ai-turn" : "other-turn")
  }) : {}, {
    p: $data.gameStatus !== "waiting" && $data.gamePiles
  }, $data.gameStatus !== "waiting" && $data.gamePiles ? {
    q: common_vendor.f($data.orderedSuits, (suit, k0, i0) => {
      return common_vendor.e({
        a: $data.gamePiles[suit] && $data.gamePiles[suit].cards && $data.gamePiles[suit].cards.length > 0
      }, $data.gamePiles[suit] && $data.gamePiles[suit].cards && $data.gamePiles[suit].cards.length > 0 ? common_vendor.e({
        b: common_vendor.t($options.getSuitSymbol(suit)),
        c: common_vendor.t($data.gamePiles[suit].count),
        d: common_vendor.f($options.getPileCardsSorted(suit), (entry, index, i1) => {
          return {
            a: common_vendor.t(entry.card.rank),
            b: common_vendor.t($options.getSuitSymbol(entry.card.suit)),
            c: index,
            d: common_vendor.n("card-" + entry.card.suit),
            e: common_vendor.n(entry.card.rank === "7" ? "seven-card" : "")
          };
        }),
        e: $data.gamePiles[suit].playedBy
      }, $data.gamePiles[suit].playedBy ? {
        f: common_vendor.t($data.gamePiles[suit].playedBy)
      } : {}) : {}, {
        g: suit
      });
    })
  } : {}, {
    r: common_vendor.t($data.playerlist.length),
    s: common_vendor.f($data.playerlist, (item, index, i0) => {
      return {
        a: common_vendor.t(index + 1),
        b: common_vendor.t(item.deviceId || item),
        c: index
      };
    }),
    t: $data.gameStatus !== "waiting" && $data.playerCards.length > 0
  }, $data.gameStatus !== "waiting" && $data.playerCards.length > 0 ? common_vendor.e({
    v: common_vendor.t($data.playerCards.length),
    w: $data.selectedCard
  }, $data.selectedCard ? common_vendor.e({
    x: common_vendor.t($data.selectedCard.rank),
    y: common_vendor.t($options.getSuitSymbol($data.selectedCard.suit)),
    z: common_vendor.n("card-" + $data.selectedCard.suit),
    A: common_vendor.o((...args) => $options.playCard && $options.playCard(...args)),
    B: common_vendor.o((...args) => $options.clearSelection && $options.clearSelection(...args)),
    C: $data.isPlayerTurn && $data.gameStatus === "playing"
  }, $data.isPlayerTurn && $data.gameStatus === "playing" ? common_vendor.e({
    D: common_vendor.o((...args) => $options.passTurn && $options.passTurn(...args)),
    E: !$data.canPass,
    F: !$data.canPass
  }, !$data.canPass ? {
    G: common_vendor.t($data.passHint)
  } : {}) : {}) : {}, {
    H: $options.getCardsBySuit("spades").length > 0
  }, $options.getCardsBySuit("spades").length > 0 ? {
    I: common_vendor.t($options.getCardsBySuit("spades").length),
    J: common_vendor.f($options.getCardsBySuit("spades"), (card, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(card.rank),
        b: common_vendor.t($options.getSuitSymbol(card.suit)),
        c: $data.selectedCard && $data.selectedCard.id === card.id
      }, $data.selectedCard && $data.selectedCard.id === card.id ? {} : {}, {
        d: common_vendor.n("card-" + card.suit),
        e: common_vendor.n($data.selectedCard && $data.selectedCard.id === card.id ? "selected" : ""),
        f: common_vendor.o(($event) => $options.selectCard(card), card.id),
        g: card.id
      });
    })
  } : {}, {
    K: $options.getCardsBySuit("hearts").length > 0
  }, $options.getCardsBySuit("hearts").length > 0 ? {
    L: common_vendor.t($options.getCardsBySuit("hearts").length),
    M: common_vendor.f($options.getCardsBySuit("hearts"), (card, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(card.rank),
        b: common_vendor.t($options.getSuitSymbol(card.suit)),
        c: $data.selectedCard && $data.selectedCard.id === card.id
      }, $data.selectedCard && $data.selectedCard.id === card.id ? {} : {}, {
        d: common_vendor.n("card-" + card.suit),
        e: common_vendor.n($data.selectedCard && $data.selectedCard.id === card.id ? "selected" : ""),
        f: common_vendor.o(($event) => $options.selectCard(card), card.id),
        g: card.id
      });
    })
  } : {}, {
    N: $options.getCardsBySuit("clubs").length > 0
  }, $options.getCardsBySuit("clubs").length > 0 ? {
    O: common_vendor.t($options.getCardsBySuit("clubs").length),
    P: common_vendor.f($options.getCardsBySuit("clubs"), (card, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(card.rank),
        b: common_vendor.t($options.getSuitSymbol(card.suit)),
        c: $data.selectedCard && $data.selectedCard.id === card.id
      }, $data.selectedCard && $data.selectedCard.id === card.id ? {} : {}, {
        d: common_vendor.n("card-" + card.suit),
        e: common_vendor.n($data.selectedCard && $data.selectedCard.id === card.id ? "selected" : ""),
        f: common_vendor.o(($event) => $options.selectCard(card), card.id),
        g: card.id
      });
    })
  } : {}, {
    Q: $options.getCardsBySuit("diamonds").length > 0
  }, $options.getCardsBySuit("diamonds").length > 0 ? {
    R: common_vendor.t($options.getCardsBySuit("diamonds").length),
    S: common_vendor.f($options.getCardsBySuit("diamonds"), (card, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(card.rank),
        b: common_vendor.t($options.getSuitSymbol(card.suit)),
        c: $data.selectedCard && $data.selectedCard.id === card.id
      }, $data.selectedCard && $data.selectedCard.id === card.id ? {} : {}, {
        d: common_vendor.n("card-" + card.suit),
        e: common_vendor.n($data.selectedCard && $data.selectedCard.id === card.id ? "selected" : ""),
        f: common_vendor.o(($event) => $options.selectCard(card), card.id),
        g: card.id
      });
    })
  } : {}) : {}, {
    T: $data.gameStatus === "playing"
  }, $data.gameStatus === "playing" ? {
    U: common_vendor.t($data.gameRounds),
    V: common_vendor.t($data.aiPlayCount),
    W: common_vendor.t($data.remainingAIPlayers),
    X: common_vendor.t($data.aiThinkTime)
  } : {}, {
    Y: $data.isAIPlayerTurn
  }, $data.isAIPlayerTurn ? {} : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/ai-battle/ai-battle.js.map
