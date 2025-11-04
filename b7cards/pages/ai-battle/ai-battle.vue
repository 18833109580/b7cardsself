<template>
  <view class="ai-container">
    <!-- 返回按钮 -->
    <view class="back-button" @click="goBack">
      <text class="back-text">← 返回菜单</text>
    </view>
    
    <!-- AI对战模式标识 -->
    <view class="ai-mode-banner">
      <view class="ai-icon">🤖</view>
      <text class="ai-text">AI对战模式</text>
      <view class="ai-subtitle">挑战人工智能对手</view>
    </view>
    
    <!-- AI玩家状态 -->
    <view class="ai-players-section">
      <h3>AI玩家状态</h3>
      <view class="ai-players-container">
        <view class="ai-player" v-for="(ai, index) in aiPlayers" :key="index">
          <view class="ai-avatar">🤖</view>
          <view class="ai-info">
            <text class="ai-name">{{ ai.name }}</text>
            <text class="ai-cards">手牌: {{ ai.cards }}张</text>
            <text class="ai-status" :class="{ 'ai-thinking': ai.isThinking }">
              {{ ai.isThinking ? '思考中...' : '等待中' }}
            </text>
          </view>
          <view class="ai-level">Lv.{{ ai.level }}</view>
        </view>
      </view>
    </view>
    
    <!-- 游戏控制按钮 -->
    <view class="control-section">
      <button @click="SynInformation" :disabled="!canbutton" class="control-btn">
        <text class="btn-icon">🔄</text>
        同步信息
      </button>
      <button @click="startAIGame" :disabled="!canbutton" class="control-btn primary">
        <text class="btn-icon">🚀</text>
        开始AI对战
      </button>
      <button @click="restartAIGame" :disabled="gameStatus !== 'playing'" class="control-btn secondary">
        <text class="btn-icon">🔄</text>
        重新开始
      </button>
    </view>
    
    <!-- 出牌权显示 -->
    <view class="turn-section" v-if="gameStatus === 'playing' && currentPlayer">
      <view :class="['turn-indicator', isYourTurn ? 'your-turn' : isAIPlayerTurn ? 'ai-turn' : 'other-turn']">
        <text v-if="isYourTurn" class="turn-text">🎮 轮到您出牌</text>
        <text v-else-if="isAIPlayerTurn" class="turn-text">🤖 轮到AI玩家 {{ currentPlayer }} 思考中...</text>
        <text v-else class="turn-text">⏳ 轮到玩家 {{ currentPlayer }} 出牌</text>
      </view>
    </view>
    
    <!-- 牌堆显示 - 只在有牌时显示 -->
    <view class="piles-section" v-if="gamePiles">
      <h3>牌堆</h3>
      <view class="piles-container">
        <view v-for="(pile, suit) in gamePiles" :key="suit">
          <!-- 只在有牌时显示牌堆 -->
          <view v-if="pile.cards && pile.cards.length > 0" class="pile-item">
            <view class="pile">
              <!-- 牌堆标题 - 显示花色和牌数 -->
              <view class="pile-header">
                <text class="pile-suit">{{ getSuitSymbol(suit) }}</text>
                <text class="pile-count">{{ pile.count }}张</text>
              </view>
              
              <!-- 牌堆序列 - 横向展开，每张牌完整显示 -->
              <view class="pile-cards">
                <view class="pile-sequence">
                  <view 
                    v-for="(entry, index) in pile.cards" 
                    :key="index"
                    :class="['pile-card', 'card-' + entry.card.suit, entry.card.rank === '7' ? 'seven-card' : '']"
                    :style="{ marginLeft: index > 0 ? '-20px' : '0' }"
                  >
                    <text class="card-rank">{{ entry.card.rank }}</text>
                    <text class="card-suit">{{ getSuitSymbol(entry.card.suit) }}</text>
                  </view>
                </view>
              </view>
              
              <text v-if="pile.playedBy" class="pile-player">
                最后出牌: {{ pile.playedBy }}
              </text>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 玩家列表 -->
    <view class="player-section">
      <h3>游戏玩家 ({{ playerlist.length }})</h3>
      <ul>
        <li v-for="(item, index) in playerlist" :key="index">
          玩家{{ index+1 }}: {{ item.deviceId || item }}
        </li>
      </ul>
    </view>
    
    <!-- 玩家手牌 -->
    <view class="cards-section" v-if="playerCards.length > 0">
      <h3>你的手牌 ({{ playerCards.length }}张)</h3>
      
      <!-- 选中的牌 -->
      <view class="selected-section" v-if="selectedCard">
        <h4>已选牌</h4>
        <view class="selected-cards">
          <view class="card-item">
            <view :class="['card', 'card-' + selectedCard.suit, 'selected']">
              <text class="card-rank">{{ selectedCard.rank }}</text>
              <text class="card-suit">{{ getSuitSymbol(selectedCard.suit) }}</text>
            </view>
          </view>
        </view>
        <view class="action-buttons">
          <button @click="playCard" class="play-btn">出牌</button>
          <button @click="clearSelection" class="clear-btn">取消选择</button>
        </view>
        
        <!-- Pass按钮 -->
        <view class="pass-section" v-if="isYourTurn && gameStatus === 'playing'">
          <button @click="passTurn" class="pass-btn" :disabled="!canPass">
            Pass
          </button>
          <text v-if="!canPass" class="pass-hint">
            {{ passHint }}
          </text>
        </view>
      </view>
      
      <!-- 所有手牌 -->
      <view class="cards-container">
        <view v-for="(card, index) in playerCards" :key="index" class="card-item">
          <view 
            :class="['card', 'card-' + card.suit, selectedCard && selectedCard.id === card.id ? 'selected' : '']"
            @click="selectCard(card)"
          >
            <text class="card-rank">{{ card.rank }}</text>
            <text class="card-suit">{{ getSuitSymbol(card.suit) }}</text>
            <text v-if="selectedCard && selectedCard.id === card.id" class="selected-mark">✓</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- AI对战统计 -->
    <view class="stats-section" v-if="gameStatus === 'playing'">
      <h3>对战统计</h3>
      <view class="stats-container">
        <view class="stat-item">
          <text class="stat-label">游戏回合</text>
          <text class="stat-value">{{ gameRounds }}</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">AI出牌次数</text>
          <text class="stat-value">{{ aiPlayCount }}</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">剩余AI玩家</text>
          <text class="stat-value">{{ remainingAIPlayers }}</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">AI思考时间</text>
          <text class="stat-value">{{ aiThinkTime }}s</text>
        </view>
      </view>
    </view>
    
    <!-- AI思考动画 -->
    <view class="ai-thinking-animation" v-if="isAIPlayerTurn">
      <view class="thinking-dots">
        <view class="dot"></view>
        <view class="dot"></view>
        <view class="dot"></view>
      </view>
      <text class="thinking-text">AI正在思考最佳策略...</text>
    </view>
    
  </view>
</template>

<script>
export default {
  
	data(){
		return{
			playerCards: [],
			playerlist: [], // 初始化playerlist
			selectedCard: null, // 选中的单张牌
			gameStatus: 'waiting', // waiting, playing, ended
			gamePiles: {
				hearts: { suit: 'hearts', count: 0, topCard: null, cards: [] },
				spades: { suit: 'spades', count: 0, topCard: null, cards: [] },
				diamonds: { suit: 'diamonds', count: 0, topCard: null, cards: [] },
				clubs: { suit: 'clubs', count: 0, topCard: null, cards: [] }
			},
			// 新增数据字段
			deductedCards: [], // 扣牌记录
			gameRounds: 0, // 游戏回合数
			aiPlayCount: 0, // AI出牌次数
			remainingAIPlayers: 3, // 剩余AI玩家
			aiThinkTime: 0, // AI思考时间
			currentPlayer: null, // 当前玩家
			isPlayerTurn: false, // 是否是玩家回合
			isAIPlayerTurn: false, // 是否是AI回合
			scores: {
				player: { total: 0, penalty: 0, status: 'playing' },
				ai1: { total: 0, penalty: 0, status: 'playing' },
				ai2: { total: 0, penalty: 0, status: 'playing' },
				ai3: { total: 0, penalty: 0, status: 'playing' }
			},
			aiPlayers: [
				{ name: 'AI玩家1', cards: 13, isThinking: false, level: 3, handCards: [], status: 'playing' },
				{ name: 'AI玩家2', cards: 13, isThinking: false, level: 2, handCards: [], status: 'playing' },
				{ name: 'AI玩家3', cards: 13, isThinking: false, level: 1, handCards: [], status: 'playing' }
			],
			canbutton: true, // 控制按钮状态
			canPass: false, // 是否可以Pass
			passHint: '' // Pass提示
		};
	},
	methods: {

	},
  onLoad(){
    this.initGame();
  },
  methods: {
    // 返回菜单
    goBack() {
      uni.navigateTo({
        url: '/pages/menu/menu'
      });
    },
    
    // 初始化游戏
    initGame() {
      // 初始化牌组
      const suits = ['spades', 'hearts', 'clubs', 'diamonds'];
      const ranks = ['K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2', 'A'];
      
      // 创建完整牌组
      let deck = [];
      suits.forEach(suit => {
        ranks.forEach(rank => {
          deck.push({
            id: `${suit}-${rank}`,
            suit: suit,
            rank: rank,
            color: suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black',
            value: this.getCardValue(rank)
          });
        });
      });
      
      // 洗牌（Fisher-Yates算法）
      const shuffleDeck = (deck) => {
        for (let i = deck.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
      };
      deck = shuffleDeck(deck);
      
      // 发牌（每人13张）
      this.playerCards = deck.slice(0, 13).sort(this.sortCards);
      this.aiPlayers = [
        { name: 'AI玩家1', cards: 13, isThinking: false, level: 3, handCards: deck.slice(13, 26).sort(this.sortCards) },
        { name: 'AI玩家2', cards: 13, isThinking: false, level: 2, handCards: deck.slice(26, 39).sort(this.sortCards) },
        { name: 'AI玩家3', cards: 13, isThinking: false, level: 1, handCards: deck.slice(39, 52).sort(this.sortCards) }
      ];
      
      // 初始化游戏状态
      this.gameStatus = 'waitingFirstPlay';
      this.currentPlayer = this.findSpade7Holder();
      this.isPlayerTurn = this.currentPlayer === 'player';
      this.isAIPlayerTurn = !this.isPlayerTurn;
      
      // 如果是AI先出牌，直接开始AI回合
      if (this.isAIPlayerTurn) {
        setTimeout(() => {
          this.aiPlay();
        }, 1000);
      }
      
      // 如果是AI先出牌，直接开始AI回合
      if (this.isAIPlayerTurn) {
        setTimeout(() => {
          this.aiPlay();
        }, 1000);
      }
      
      // 初始化牌堆
      this.gamePiles = {
        spades: { suit: 'spades', count: 0, topCard: null, cards: [] },
        hearts: { suit: 'hearts', count: 0, topCard: null, cards: [] },
        clubs: { suit: 'clubs', count: 0, topCard: null, cards: [] },
        diamonds: { suit: 'diamonds', count: 0, topCard: null, cards: [] }
      };
      
      // 初始化得分
      this.scores = {
        player: { total: 0, penalty: 0, status: 'playing' },
        ai1: { total: 0, penalty: 0, status: 'playing' },
        ai2: { total: 0, penalty: 0, status: 'playing' },
        ai3: { total: 0, penalty: 0, status: 'playing' }
      };
      
      uni.showToast({
        title: '游戏开始！每人13张牌',
        icon: 'success',
        duration: 2000
      });
    },
    
    // 获取牌面分值
    getCardValue(rank) {
      const values = {
        'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, '7': 7,
        '6': 6, '5': 5, '4': 4, '3': 3, '2': 2, 'A': 1
      };
      return values[rank] || 0;
    },
    
    // 排序牌组（按花色和大小）
    sortCards(a, b) {
      const suitOrder = { 'spades': 0, 'hearts': 1, 'clubs': 2, 'diamonds': 3 };
      const rankOrder = { 'K': 0, 'Q': 1, 'J': 2, '10': 3, '9': 4, '8': 5, '7': 6, '6': 7, '5': 8, '4': 9, '3': 10, '2': 11, 'A': 12 };
      
      if (suitOrder[a.suit] !== suitOrder[b.suit]) {
        return suitOrder[a.suit] - suitOrder[b.suit];
      }
      return rankOrder[a.rank] - rankOrder[b.rank];
    },
    
    // 查找黑桃7持有者
    findSpade7Holder() {
      // 检查玩家是否有黑桃7
      if (this.playerCards.some(card => card.suit === 'spades' && card.rank === '7')) {
        return 'player';
      }
      
      // 检查AI是否有黑桃7
      for (let i = 0; i < this.aiPlayers.length; i++) {
        if (this.aiPlayers[i].handCards.some(card => card.suit === 'spades' && card.rank === '7')) {
          return `ai${i+1}`;
        }
      }
      
      return 'player'; // 默认玩家先出
    },
    
    // 检查是否为活牌
    isActiveCard(card) {
      // 7永远是活牌
      if (card.rank === '7') return true;
      
      const pile = this.gamePiles[card.suit];
      if (!pile.topCard) return false;
      
      // 检查是否与同花色牌相邻
      const currentRank = pile.topCard.rank;
      const rankOrder = ['K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2', 'A'];
      const currentIndex = rankOrder.indexOf(currentRank);
      const cardIndex = rankOrder.indexOf(card.rank);
      
      return Math.abs(currentIndex - cardIndex) === 1;
    },
    
    // 获取活牌列表
    getActiveCards(cards) {
      return cards.filter(card => this.isActiveCard(card));
    },
    
    // 开始游戏
    startAIGame() {
      this.initGame();
      
      // 确保游戏状态正确设置
      this.gameStatus = 'waitingFirstPlay';
      
      // 显示当前玩家信息
      if (this.currentPlayer === 'player') {
        uni.showToast({
          title: '轮到您先出牌（黑桃7）',
          icon: 'none',
          duration: 2000
        });
      } else {
        uni.showToast({
          title: '轮到AI先出牌',
          icon: 'none',
          duration: 2000
        });
      }
    },
    
    // 重新开始游戏
    restartAIGame() {
      this.initGame();
    },
    
    getSuitSymbol(suit) {
      switch(suit) {
        case 'hearts': return '♥';
        case 'spades': return '♠';
        case 'clubs': return '♣';
        case 'diamonds': return '♦';
        default: return suit;
      }
    },
    
    // 选择单张牌
    selectCard(card) {
      if (this.gameStatus === 'waitingFirstPlay') {
        // 首出必须是黑桃7
        if (card.suit !== 'spades' || card.rank !== '7') {
          uni.showToast({
            title: '首出必须是黑桃7',
            icon: 'none',
            duration: 2000
          });
          return;
        }
      } else {
        // 检查是否为活牌
        const activeCards = this.getActiveCards(this.playerCards);
        if (activeCards.length > 0 && !activeCards.some(c => c.id === card.id)) {
          uni.showToast({
            title: '请先出活牌',
            icon: 'none',
            duration: 2000
          });
          return;
        }
      }
      
      if (this.selectedCard && this.selectedCard.id === card.id) {
        this.selectedCard = null;
      } else {
        this.selectedCard = card;
      }
      
      // 更新Pass按钮状态
      this.updatePassButton();
    },
    
    // 取消选择
    clearSelection() {
      this.selectedCard = null;
    },
    
    // 出牌
    playCard() {
      if (!this.selectedCard) {
        uni.showToast({
          title: '请先选择要出的牌',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      
      // 首出特殊处理
      if (this.gameStatus === 'waitingFirstPlay') {
        if (this.selectedCard.suit !== 'spades' || this.selectedCard.rank !== '7') {
          uni.showToast({
            title: '首出必须是黑桃7',
            icon: 'none',
            duration: 2000
          });
          return;
        }
        this.gameStatus = 'playing';
      }
      
      // 添加到牌堆
      const pile = this.gamePiles[this.selectedCard.suit];
      pile.cards.push({
        card: this.selectedCard,
        playedBy: 'player'
      });
      pile.count++;
      pile.topCard = this.selectedCard;
      
      // 从玩家手牌中移除
      this.playerCards = this.playerCards.filter(card => card.id !== this.selectedCard.id);
      this.selectedCard = null;
      
      // 切换到AI回合
      this.isPlayerTurn = false;
      this.isAIPlayerTurn = true;
      
      // 更新当前玩家为AI
      this.currentPlayer = this.getNextPlayer();
      
      // AI思考
      setTimeout(() => {
        this.aiPlay();
      }, 1000);
      
      uni.showToast({
        title: '出牌成功',
        icon: 'success',
        duration: 2000
      });
    },
    
    // 更新Pass按钮状态
    updatePassButton() {
      const activeCards = this.getActiveCards(this.playerCards);
      this.canPass = activeCards.length === 0;
      this.passHint = activeCards.length > 0 ? '您还有活牌可出' : '可以扣牌';
    },
    
    // 扣牌（Pass）
    passTurn() {
      if (!this.canPass) {
        uni.showToast({
          title: '您还有活牌可出',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      
      // 按规则选择扣牌（黑桃→红桃→梅花→方片，K→A）
      const suitsOrder = ['spades', 'hearts', 'clubs', 'diamonds'];
      const ranksOrder = ['K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2', 'A'];
      
      let cardToPenalty = null;
      
      for (const suit of suitsOrder) {
        const suitCards = this.playerCards.filter(card => card.suit === suit);
        if (suitCards.length > 0) {
          for (const rank of ranksOrder) {
            const card = suitCards.find(c => c.rank === rank);
            if (card) {
              cardToPenalty = card;
              break;
            }
          }
          if (cardToPenalty) break;
        }
      }
      
      if (!cardToPenalty) {
        cardToPenalty = this.playerCards[0];
      }
      
      // 记录扣牌
      this.scores.player.penalty += cardToPenalty.value;
      this.deductedCards.push(cardToPenalty);
      
      // 从手牌中移除
      this.playerCards = this.playerCards.filter(card => card.id !== cardToPenalty.id);
      
      // 切换到AI回合
      this.isPlayerTurn = false;
      this.isAIPlayerTurn = true;
      
      // 更新当前玩家为AI
      this.currentPlayer = this.getNextPlayer();
      
      // AI思考
      setTimeout(() => {
        this.aiPlay();
      }, 1000);
      
      uni.showToast({
        title: `扣牌成功: ${cardToPenalty.rank}${this.getSuitSymbol(cardToPenalty.suit)} (${cardToPenalty.value}分)`,
        icon: 'none',
        duration: 2000
      });
    },
    
    // 扣牌（旧方法，保持兼容性）
    penaltyCard() {
      if (this.getActiveCards(this.playerCards).length > 0) {
        uni.showToast({
          title: '您还有活牌可出',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      
      // 按规则选择扣牌（黑桃→红桃→梅花→方片，K→A）
      const suitsOrder = ['spades', 'hearts', 'clubs', 'diamonds'];
      const ranksOrder = ['K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2', 'A'];
      
      let cardToPenalty = null;
      
      for (const suit of suitsOrder) {
        const suitCards = this.playerCards.filter(card => card.suit === suit);
        if (suitCards.length > 0) {
          for (const rank of ranksOrder) {
            const card = suitCards.find(c => c.rank === rank);
            if (card) {
              cardToPenalty = card;
              break;
            }
          }
          if (cardToPenalty) break;
        }
      }
      
      if (!cardToPenalty) {
        cardToPenalty = this.playerCards[0];
      }
      
      // 记录扣牌
      this.scores.player.penalty += cardToPenalty.value;
      
      // 从手牌中移除
      this.playerCards = this.playerCards.filter(card => card.id !== cardToPenalty.id);
      
      // 切换到AI回合
      this.isPlayerTurn = false;
      this.isAIPlayerTurn = true;
      
      // 更新当前玩家为AI
      this.currentPlayer = this.getNextPlayer();
      
      // AI思考
      setTimeout(() => {
        this.aiPlay();
      }, 1000);
      
      uni.showToast({
        title: `扣牌成功: ${cardToPenalty.rank}${this.getSuitSymbol(cardToPenalty.suit)} (${cardToPenalty.value}分)`,
        icon: 'none',
        duration: 2000
      });
    },
    
    // AI出牌逻辑
    aiPlay() {
      // 找到当前应该出牌的AI
      const aiIndex = this.getCurrentAIIndex();
      if (aiIndex === -1) {
        this.endGame();
        return;
      }
      
      const currentAI = this.aiPlayers[aiIndex];
      
      // 模拟AI思考
      currentAI.isThinking = true;
      
      setTimeout(() => {
        currentAI.isThinking = false;
        
        let cardToPlay = null; // 声明cardToPlay变量
        
        // 首出特殊处理：必须出黑桃7
        if (this.gameStatus === 'waitingFirstPlay') {
          const spade7 = currentAI.handCards.find(card => card.suit === 'spades' && card.rank === '7');
          if (spade7) {
            cardToPlay = spade7;
            this.gameStatus = 'playing';
          } else {
            // 如果没有黑桃7，选择其他7
            cardToPlay = currentAI.handCards.find(card => card.rank === '7');
            if (cardToPlay) {
              this.gameStatus = 'playing';
            }
          }
        } else {
          // 正常出牌：获取活牌
          const activeCards = this.getActiveCards(currentAI.handCards);
          
          if (activeCards.length > 0) {
            // 按规则出牌（黑桃→红桃→梅花→方片，K→A）
            const suitsOrder = ['spades', 'hearts', 'clubs', 'diamonds'];
            const ranksOrder = ['K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2', 'A'];
            
            for (const suit of suitsOrder) {
              const suitCards = activeCards.filter(card => card.suit === suit);
              if (suitCards.length > 0) {
                for (const rank of ranksOrder) {
                  const card = suitCards.find(c => c.rank === rank);
                  if (card) {
                    cardToPlay = card;
                    break;
                  }
                }
                if (cardToPlay) break;
              }
            }
          }
        }
        
        if (cardToPlay) {
          // 添加到牌堆
          const pile = this.gamePiles[cardToPlay.suit];
          pile.cards.push({
            card: cardToPlay,
            playedBy: currentAI.name
          });
          pile.count++;
          pile.topCard = cardToPlay;
          
          // 从AI手牌中移除
          currentAI.handCards = currentAI.handCards.filter(card => card.id !== cardToPlay.id);
          currentAI.cards--;
          
          // 更新统计
          this.aiPlayCount++;
          this.gameRounds++;
          
          uni.showToast({
            title: `${currentAI.name} 出牌: ${cardToPlay.rank}${this.getSuitSymbol(cardToPlay.suit)}`,
            icon: 'none',
            duration: 2000
          });
        } else {
          // 检查是否有活牌可以出
          const activeCards = this.getActiveCards(currentAI.handCards);
          
          if (activeCards.length === 0) {
            // 没有活牌，AI选择过牌
            uni.showToast({
              title: `${currentAI.name} 选择过牌（没有活牌）`,
              icon: 'none',
              duration: 2000
            });
            
            // 记录过牌
            const aiKey = `ai${aiIndex + 1}`;
            this.scores[aiKey].passCount = (this.scores[aiKey].passCount || 0) + 1;
            
            // 切换到下一个回合
            this.nextTurn();
            return;
          } else {
            // 有活牌但AI逻辑没有找到，强制扣牌
            const suitsOrder = ['spades', 'hearts', 'clubs', 'diamonds'];
            const ranksOrder = ['K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2', 'A'];
            
            let cardToPenalty = null;
            
            for (const suit of suitsOrder) {
              const suitCards = currentAI.handCards.filter(card => card.suit === suit);
              if (suitCards.length > 0) {
                for (const rank of ranksOrder) {
                  const card = suitCards.find(c => c.rank === rank);
                  if (card) {
                    cardToPenalty = card;
                    break;
                  }
                }
                if (cardToPenalty) break;
              }
            }
            
            if (cardToPenalty) {
              // 记录扣牌
              const aiKey = `ai${aiIndex + 1}`;
              this.scores[aiKey].penalty += cardToPenalty.value;
              
              // 从AI手牌中移除
              currentAI.handCards = currentAI.handCards.filter(card => card.id !== cardToPenalty.id);
              currentAI.cards--;
              
              uni.showToast({
                title: `${currentAI.name} 扣牌: ${cardToPenalty.rank}${this.getSuitSymbol(cardToPenalty.suit)} (${cardToPenalty.value}分)`,
                icon: 'none',
                duration: 2000
              });
            }
          }
        }
        
        // 检查AI是否出完牌
        if (currentAI.handCards.length === 0) {
          currentAI.status = 'finished';
          this.remainingAIPlayers--;
          this.checkGameEnd();
          return;
        }
        
        // 检查游戏是否结束
        this.checkGameEnd();
        
        // 切换到下一个AI或玩家回合
        this.nextTurn();
        
      }, 1500);
    },
    
    // 获取当前应该出牌的AI索引
    getCurrentAIIndex() {
      // 如果当前玩家是AI，直接返回对应的索引
      if (this.currentPlayer && this.currentPlayer.startsWith('ai')) {
        const aiNumber = parseInt(this.currentPlayer.replace('ai', ''));
        const index = aiNumber - 1;
        
        // 检查该AI是否还在游戏中
        if (index >= 0 && index < this.aiPlayers.length && this.aiPlayers[index].status === 'playing') {
          return index;
        }
      }
      
      // 如果当前玩家不是AI或AI不在游戏中，找到第一个活跃的AI
      for (let i = 0; i < this.aiPlayers.length; i++) {
        if (this.aiPlayers[i].status === 'playing') {
          return i;
        }
      }
      
      return -1; // 没有活跃的AI
    },
    
    // 切换到下一个回合
    nextTurn() {
      // 更新当前玩家
      this.currentPlayer = this.getNextPlayer();
      
      if (this.currentPlayer === 'player') {
        // 切换到玩家回合
        this.isPlayerTurn = true;
        this.isAIPlayerTurn = false;
        
        // 更新Pass按钮状态
        this.updatePassButton();
      } else {
        // 切换到AI回合
        this.isPlayerTurn = false;
        this.isAIPlayerTurn = true;
        
        // 设置当前AI玩家名称
        const aiIndex = this.getCurrentAIIndex();
        if (aiIndex !== -1) {
          this.currentPlayer = `ai${aiIndex + 1}`;
        }
        
        // 开始AI出牌
        setTimeout(() => {
          this.aiPlay();
        }, 1000);
      }
    },
    
    // 检查游戏是否结束
    checkGameEnd() {
      // 更新玩家状态
      if (this.playerCards.length === 0) {
        this.scores.player.status = 'finished';
      } else {
        this.scores.player.status = 'playing';
      }
      
      // 更新AI状态
      this.aiPlayers.forEach((ai, index) => {
        const aiKey = `ai${index + 1}`;
        if (ai.handCards.length === 0) {
          this.scores[aiKey].status = 'finished';
        } else {
          this.scores[aiKey].status = 'playing';
        }
      });
      
      // 计算仍在游戏中的玩家数量
      const allPlayers = ['player', 'ai1', 'ai2', 'ai3'];
      const playingPlayers = allPlayers.filter(p => this.scores[p].status === 'playing');
      
      // 只有当只剩下一个玩家或没有玩家在游戏中时才结束游戏
      if (playingPlayers.length <= 1) {
        const lastPlayer = playingPlayers.length === 1 ? playingPlayers[0] : null;
        this.endGame(lastPlayer);
      }
    },
    
    // 游戏结束
    endGame(lastPlayer) {
      // 只有当游戏状态是playing时才结束游戏
      if (this.gameStatus !== 'finished') {
        return;
      }
      
      this.gameStatus = 'ended';
      
      // 计算得分
      this.calculateScores();
      
      // 显示结果
      let resultMessage = '游戏结束！';
      resultMessage += `玩家得分: ${this.scores.player.total}
`;
      this.aiPlayers.forEach((ai, index) => {
        resultMessage += `${ai.name}得分: ${this.scores[`ai${index+1}`].total}
`;
      });
      
      // 显示获胜者
      if (lastPlayer) {
        const winnerName = lastPlayer === 'player' ? '玩家' : this.aiPlayers[parseInt(lastPlayer.replace('ai', '')) - 1].name;
        resultMessage += `
获胜者: ${winnerName}`;
      } else {
        resultMessage += '游戏平局！';
      }
      
      uni.showModal({
        title: '游戏结果',
        content: resultMessage,
        showCancel: false
      });
    },
    
    // 计算得分
    calculateScores() {
      // 计算基础分
      const allPlayers = ['player', 'ai1', 'ai2', 'ai3'];
      const finishedPlayers = allPlayers.filter(p => this.scores[p].status === 'finished');
      const playingPlayers = allPlayers.filter(p => this.scores[p].status === 'playing');
      
      // 检查倒拉七（独头七）
      const lastPlayer = this.getLastFinishedPlayer();
      const isLastCardSeven = this.checkLastCardIsSeven(lastPlayer);
      
      // 计算倍数
      let multiplier = 1;
      if (finishedPlayers.length >= 3) multiplier = 8; // 三通
      else if (finishedPlayers.length >= 2) multiplier = 4; // 双通
      else if (finishedPlayers.length >= 1) multiplier = 2; // 净手
      
      // 倒拉七（独头七）最高倍数
      if (isLastCardSeven) {
        multiplier = 8; // 倒拉七
      }
      
      // 检查4个K补助
      this.checkFourKBonus();
      
      // 计算每个玩家的得分
      allPlayers.forEach(player => {
        if (this.scores[player].status === 'finished') {
          // 净手玩家得分为其他玩家扣牌分总和 × 倍数
          const otherPenalty = playingPlayers.reduce((sum, p) => sum + this.scores[p].penalty, 0);
          this.scores[player].total = otherPenalty * multiplier;
        } else {
          // 未净手玩家得分为 -(扣牌分 × (玩家人数-1))
          this.scores[player].total = -this.scores[player].penalty * (allPlayers.length - 1);
        }
        
        // 额外倍数：扣牌分超30点×2、超50点×4、超70点×8
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
      const allPlayers = ['player', 'ai1', 'ai2', 'ai3'];
      return allPlayers.find(p => this.scores[p].status === 'finished');
    },
    
    // 检查最后一张牌是否为7
    checkLastCardIsSeven(player) {
      if (!player) return false;
      
      // 这里需要记录最后出牌的信息
      // 简化实现：检查该玩家最后一张牌是否为7
      return false; // 需要更详细的实现
    },
    
    // 检查4个K补助
    checkFourKBonus() {
      const allPlayers = ['player', 'ai1', 'ai2', 'ai3'];
      
      allPlayers.forEach(player => {
        if (this.scores[player].status === 'finished') {
          // 检查该玩家是否有4个K
          const hasFourK = this.checkPlayerHasFourK(player);
          if (hasFourK) {
            // 其他3家各支付1个底金
            const otherPlayers = allPlayers.filter(p => p !== player);
            otherPlayers.forEach(other => {
              this.scores[other].total -= 1; // 简化实现，实际应为底金金额
            });
            this.scores[player].total += 3; // 获得3个底金
          }
        }
      });
    },
    
    // 检查玩家是否有4个K
    checkPlayerHasFourK(player) {
      // 这里需要检查玩家手牌中是否有4个K
      // 简化实现
      return false;
    },
    
    // 获取下一个玩家
    getNextPlayer() {
      const players = ['player', 'ai1', 'ai2', 'ai3'];
      const currentIndex = players.indexOf(this.currentPlayer);
      const nextIndex = (currentIndex + 1) % players.length;
      return players[nextIndex];
    },
    
    // 显示提示信息
    showToast(message) {
      uni.showToast({
        title: message,
        icon: 'none',
        duration: 2000
      });
    }
  }
}
</script>

<style>
/* AI对战特有样式 - 科技感设计 */
.ai-container {
  padding: 16px;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
  min-height: 100vh;
  font-family: 'Courier New', monospace;
  color: #ffffff;
}

/* AI对战模式标识 */
.ai-mode-banner {
  text-align: center;
  margin: 20px 0 30px 0;
  padding: 20px;
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(0, 255, 255, 0.2) 100%);
  border: 2px solid #00ffff;
  border-radius: 12px;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
}

.ai-mode-banner::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(0, 255, 255, 0.1), transparent);
  animation: shine 3s infinite;
}

@keyframes shine {
  0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
  100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
}

.ai-icon {
  font-size: 48px;
  margin-bottom: 10px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.ai-text {
  font-size: 24px;
  font-weight: bold;
  color: #00ffff;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
  display: block;
  margin-bottom: 5px;
}

.ai-subtitle {
  font-size: 14px;
  color: #88ffff;
  opacity: 0.8;
}

/* AI玩家状态区域 */
.ai-players-section {
  margin: 20px 0;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.ai-players-section h3 {
  margin-bottom: 16px;
  color: #00ffff;
  font-size: 18px;
  text-align: center;
  border-bottom: 1px solid rgba(0, 255, 255, 0.3);
  padding-bottom: 10px;
}

.ai-players-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ai-player {
  display: flex;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(0, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.ai-player:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(0, 255, 255, 0.5);
  transform: translateY(-2px);
}

.ai-avatar {
  font-size: 24px;
  margin-right: 12px;
}

.ai-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ai-name {
  font-weight: bold;
  color: #ffffff;
}

.ai-cards {
  font-size: 12px;
  color: #88ffff;
}

.ai-status {
  font-size: 11px;
  color: #ff6b6b;
}

.ai-status.ai-thinking {
  color: #00ffff;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.ai-level {
  background: rgba(0, 255, 255, 0.2);
  color: #00ffff;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

/* 控制按钮样式 */
.control-section {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin: 20px 0;
  flex-wrap: wrap;
}

.control-btn {
  background: rgba(0, 255, 255, 0.1);
  color: #00ffff;
  border: 2px solid #00ffff;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(10px);
}

.control-btn.primary {
  background: rgba(0, 255, 255, 0.2);
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
}

.control-btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  border-color: #ffffff;
  color: #ffffff;
}

.control-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 255, 255, 0.4);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-icon {
  font-size: 16px;
}

/* 出牌权显示样式 */
.turn-section {
  margin: 20px 0;
  padding: 16px;
  border-radius: 12px;
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 255, 255, 0.3);
  backdrop-filter: blur(10px);
}

.turn-indicator {
  padding: 16px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.your-turn {
  background: linear-gradient(135deg, #00ff88 0%, #00cc66 100%);
  color: #000000;
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
  animation: glow 2s infinite;
}

.ai-turn {
  background: linear-gradient(135deg, #00ffff 0%, #0088ff 100%);
  color: #000000;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
  animation: glow 2s infinite;
}

.other-turn {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 255, 0.5); }
  50% { box-shadow: 0 0 30px rgba(0, 255, 255, 0.8); }
}

/* 统计区域 */
.stats-section {
  margin: 20px 0;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.stats-section h3 {
  margin-bottom: 16px;
  color: #00ffff;
  font-size: 18px;
  text-align: center;
  border-bottom: 1px solid rgba(0, 255, 255, 0.3);
  padding-bottom: 10px;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(0, 255, 255, 0.2);
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #88ffff;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: bold;
  color: #00ffff;
}

/* AI思考动画 */
.ai-thinking-animation {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  padding: 16px 24px;
  border-radius: 8px;
  border: 1px solid #00ffff;
  display: flex;
  align-items: center;
  gap: 12px;
  backdrop-filter: blur(10px);
  z-index: 1000;
}

.thinking-dots {
  display: flex;
  gap: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  background: #00ffff;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.thinking-text {
  color: #00ffff;
  font-size: 14px;
}

/* 继承原有样式并适配暗色主题 */
.player-section, .cards-section, .piles-section {
  margin: 16px 0;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(0, 255, 255, 0.3);
  backdrop-filter: blur(10px);
}

.player-section h3, .cards-section h3, .piles-section h3 {
  margin-bottom: 12px;
  color: #00ffff;
  font-size: 18px;
  text-align: center;
  border-bottom: 1px solid rgba(0, 255, 255, 0.3);
  padding-bottom: 8px;
}

/* 卡牌样式适配暗色主题 */
.card {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.3);
}

.card.selected {
  border: 3px solid #00ffff;
  background: rgba(0, 255, 255, 0.1);
  box-shadow: 0 6px 0 rgba(0, 255, 255, 0.3);
}

/* 按钮样式适配 */
.play-btn {
  background: rgba(0, 255, 136, 0.2);
  border-color: #00ff88;
  color: #00ff88;
}

.clear-btn {
  background: rgba(255, 107, 107, 0.2);
  border-color: #ff6b6b;
  color: #ff6b6b;
}

.pass-btn {
  background: rgba(0, 255, 255, 0.2);
  border-color: #00ffff;
  color: #00ffff;
}

/* 返回按钮样式 */
.back-button {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #00ffff;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
  z-index: 10;
  backdrop-filter: blur(10px);
}

.back-button:active {
  transform: translateY(1px);
  box-shadow: 0 0 5px rgba(0, 255, 255, 0.3);
}

.back-text {
  font-size: 14px;
  font-weight: bold;
  color: #00ffff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ai-container {
    padding: 12px;
  }
  
  .stats-container {
    grid-template-columns: 1fr;
  }
  
  .control-section {
    flex-direction: column;
    align-items: center;
  }
  
  .control-btn {
    width: 100%;
    max-width: 280px;
    justify-content: center;
  }
  
  .back-button {
    top: 10px;
    left: 10px;
    padding: 6px 12px;
  }
}
</style>