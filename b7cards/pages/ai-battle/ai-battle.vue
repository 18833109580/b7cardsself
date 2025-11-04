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
    <view class="ai-players-section" v-if="gameStatus !== 'waiting'">
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
    <view class="turn-section" v-if="gameStatus !== 'waiting' && currentPlayer">
      <view :class="['turn-indicator', isPlayerTurn ? 'your-turn' : isAIPlayerTurn ? 'ai-turn' : 'other-turn']">
        <text v-if="isPlayerTurn" class="turn-text">🎮 轮到您出牌</text>
        <text v-else-if="isAIPlayerTurn" class="turn-text">🤖 轮到AI玩家 {{ currentPlayer }} 思考中...</text>
        <text v-else class="turn-text">⏳ 轮到玩家 {{ currentPlayer }} 出牌</text>
      </view>
    </view>
    
    <!-- 牌堆显示 - 只在游戏开始后有牌时显示 -->
    <view class="piles-section" v-if="gameStatus !== 'waiting' && gamePiles">
      <h3>牌堆</h3>
      <view class="piles-container">
        <view v-for="suit in orderedSuits" :key="suit" class="pile-column">
          <!-- 只在有牌时显示牌堆 -->
          <view v-if="gamePiles[suit] && gamePiles[suit].cards && gamePiles[suit].cards.length > 0" class="pile-item">
            <view class="pile">
              <!-- 牌堆标题 - 显示花色和牌数 -->
              <view class="pile-header">
                <text class="pile-suit">{{ getSuitSymbol(suit) }}</text>
                <text class="pile-count">{{ gamePiles[suit].count }}张</text>
              </view>
              
              <!-- 牌堆序列 - 纵向展开，每张牌完整显示 -->
              <view class="pile-cards">
                <view class="pile-sequence">
                  <view 
                    v-for="(entry, index) in getPileCardsSorted(suit)" 
                    :key="index"
                    :class="['pile-card', 'card', 'card-' + entry.card.suit, entry.card.rank === '7' ? 'seven-card' : '']"
                    :style="{ marginTop: index > 0 ? '-40px' : '0' }"
                  >
                    <text class="card-rank">{{ entry.card.rank }}</text>
                    <text class="card-suit">{{ getSuitSymbol(entry.card.suit) }}</text>
                  </view>
                </view>
              </view>
              
              <text v-if="gamePiles[suit].playedBy" class="pile-player">
                最后出牌: {{ gamePiles[suit].playedBy }}
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
    <view class="cards-section" v-if="gameStatus !== 'waiting' && playerCards.length > 0">
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
        <view class="pass-section" v-if="isPlayerTurn && gameStatus === 'playing'">
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
      passHint: '', // Pass提示
      orderedSuits: ['spades', 'hearts', 'clubs', 'diamonds']
		};
	},
  onLoad(){
    // 页面加载时只初始化基本状态，不进行发牌
    this.resetGameState();
  },
  methods: {
    // 返回菜单
    goBack() {
      uni.navigateTo({
        url: '/pages/menu/menu'
      });
    },
    
    // 重置游戏状态（页面加载时调用）
    resetGameState() {
      // 清空所有游戏数据
      this.playerCards = [];
      this.selectedCard = null;
      this.gameStatus = 'waiting';
      this.gamePiles = {
        hearts: { suit: 'hearts', count: 0, topCard: null, cards: [] },
        spades: { suit: 'spades', count: 0, topCard: null, cards: [] },
        diamonds: { suit: 'diamonds', count: 0, topCard: null, cards: [] },
        clubs: { suit: 'clubs', count: 0, topCard: null, cards: [] }
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
        player: { total: 0, penalty: 0, status: 'waiting' },
        ai1: { total: 0, penalty: 0, status: 'waiting' },
        ai2: { total: 0, penalty: 0, status: 'waiting' },
        ai3: { total: 0, penalty: 0, status: 'waiting' }
      };
      this.aiPlayers = [
        { name: 'AI玩家1', cards: 0, isThinking: false, level: 3, handCards: [], status: 'waiting' },
        { name: 'AI玩家2', cards: 0, isThinking: false, level: 2, handCards: [], status: 'waiting' },
        { name: 'AI玩家3', cards: 0, isThinking: false, level: 1, handCards: [], status: 'waiting' }
      ];
      this.canPass = false;
      this.passHint = '等待游戏开始';
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
        { name: 'AI玩家1', cards: 13, isThinking: false, level: 3, handCards: deck.slice(13, 26).sort(this.sortCards), status: 'playing' },
        { name: 'AI玩家2', cards: 13, isThinking: false, level: 2, handCards: deck.slice(26, 39).sort(this.sortCards), status: 'playing' },
        { name: 'AI玩家3', cards: 13, isThinking: false, level: 1, handCards: deck.slice(39, 52).sort(this.sortCards), status: 'playing' }
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
        }, 300);
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
    
    // 排序牌组（按花色并按 A→K 升序）
    sortCards(a, b) {
      const suitOrder = { 'spades': 0, 'hearts': 1, 'clubs': 2, 'diamonds': 3 };
      const asc = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      const rankOrder = asc.reduce((acc, r, i) => { acc[r] = i; return acc; }, {});
      
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
      const rankOrder = ['K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2', 'A'];
      const pile = this.gamePiles[card.suit];
      
      // 该花色还未出牌时，仅 7 为活牌
      if (!pile || !pile.cards || pile.cards.length === 0) {
        return card.rank === '7';
      }
      
      // 计算该花色当前已出序列两端（最小与最大索引）
      const playedIndices = pile.cards
        .map(entry => rankOrder.indexOf(entry.card.rank))
        .filter(idx => idx >= 0);
      if (playedIndices.length === 0) {
        return card.rank === '7';
      }
      const minIdx = Math.min(...playedIndices);
      const maxIdx = Math.max(...playedIndices);
      const cardIdx = rankOrder.indexOf(card.rank);
      
      // 活牌：紧邻当前序列任一端（向上或向下扩张）
      return cardIdx === minIdx - 1 || cardIdx === maxIdx + 1;
    },
    
    // 获取活牌列表
    getActiveCards(cards) {
      return cards.filter(card => this.isActiveCard(card));
    },
    
    // 开始游戏
    startAIGame() {
      // 禁用开始按钮，防止重复点击
      this.canbutton = false;
      
      // 执行发牌和游戏初始化
      this.initGame();
      
      // 显示游戏开始提示
      uni.showToast({
        title: '游戏开始！正在发牌...',
        icon: 'success',
        duration: 2000
      });
      
      // 延迟显示当前玩家信息，让用户有时间看到发牌过程
      setTimeout(() => {
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
      }, 800);
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

    // 获取按 A→K 排序后的牌堆序列
    getPileCardsSorted(suit) {
      const asc = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      const order = asc.reduce((acc, r, i) => { acc[r] = i; return acc; }, {});
      const pile = this.gamePiles[suit];
      if (!pile || !pile.cards) return [];
      return [...pile.cards].sort((e1, e2) => order[e1.card.rank] - order[e2.card.rank]);
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
      }, 500);
      
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
      }, 500);
      
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
      }, 500);
      
      uni.showToast({
        title: `扣牌成功: ${cardToPenalty.rank}${this.getSuitSymbol(cardToPenalty.suit)} (${cardToPenalty.value}分)`,
        icon: 'none',
        duration: 2000
      });
    },
    
    // AI出牌逻辑
    aiPlay() {
      console.log('aiPlay called, isAIPlayerTurn:', this.isAIPlayerTurn, 'currentPlayer:', this.currentPlayer);
      
      // 检查游戏状态
      if (this.gameStatus === 'ended' || this.gameStatus === 'finished') {
        console.log('Game already ended, stopping AI play');
        return;
      }
      
      // 找到当前应该出牌的AI
      const aiIndex = this.getCurrentAIIndex();
      console.log('Found AI index:', aiIndex);
      
      if (aiIndex === -1) {
        console.log('No active AI found, checking game end');
        this.checkGameEnd();
        return;
      }
      
      const currentAI = this.aiPlayers[aiIndex];
      console.log('Current AI:', currentAI.name, 'hand cards:', currentAI.handCards.length);
      
      // 检查AI是否还有手牌
      if (currentAI.handCards.length === 0) {
        console.log('AI has no cards left, marking as finished');
        currentAI.status = 'finished';
        this.remainingAIPlayers--;
        this.checkGameEnd();
        return;
      }
      
      // 模拟AI思考
      currentAI.isThinking = true;
      
      setTimeout(() => {
        currentAI.isThinking = false;
        
        let cardToPlay = null; // 声明cardToPlay变量
        
        // 首出特殊处理：必须出黑桃7
        if (this.gameStatus === 'waitingFirstPlay') {
          console.log('First play mode, looking for spade 7');
          const spade7 = currentAI.handCards.find(card => card.suit === 'spades' && card.rank === '7');
          if (spade7) {
            cardToPlay = spade7;
            this.gameStatus = 'playing';
            console.log('Found spade 7, setting game status to playing');
          } else {
            // 如果没有黑桃7，选择其他7
            cardToPlay = currentAI.handCards.find(card => card.rank === '7');
            if (cardToPlay) {
              this.gameStatus = 'playing';
              console.log('Found other 7, setting game status to playing');
            } else {
              console.log('No 7 found in AI hand, cannot make first play');
            }
          }
        } else {
          // 正常出牌：获取活牌
          const activeCards = this.getActiveCards(currentAI.handCards);
          console.log('Active cards found:', activeCards.length);
          
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
                    console.log('Found card to play:', card.rank, card.suit);
                    break;
                  }
                }
                if (cardToPlay) break;
              }
            }
          } else {
            console.log('No active cards available');
          }
        }
        
        if (cardToPlay) {
          console.log('Playing card:', cardToPlay.rank, cardToPlay.suit);
          
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
          currentAI.cards = currentAI.handCards.length;
          
          // 更新统计
          this.aiPlayCount++;
          this.gameRounds++;
          
          uni.showToast({
            title: `${currentAI.name} 出牌: ${cardToPlay.rank}${this.getSuitSymbol(cardToPlay.suit)}`,
            icon: 'none',
            duration: 2000
          });
          
          // 检查AI是否出完牌
          if (currentAI.handCards.length === 0) {
            console.log('AI finished all cards');
            currentAI.status = 'finished';
            this.remainingAIPlayers--;
            this.checkGameEnd();
            return;
          }
          
          // 检查游戏是否结束
          this.checkGameEnd();
          
          // 切换到下一个回合
          this.nextTurn();
          
        } else {
          // 检查是否有活牌可以出
          const activeCards = this.getActiveCards(currentAI.handCards);
          console.log('No card selected, checking active cards:', activeCards.length);
          
          if (activeCards.length === 0) {
            // 没有活牌，AI选择过牌
            console.log('No active cards, AI will pass');
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
            console.log('Has active cards but no card selected, forcing penalty');
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
              console.log('Penalty card selected:', cardToPenalty.rank, cardToPenalty.suit);
              
              // 记录扣牌
              const aiKey = `ai${aiIndex + 1}`;
              this.scores[aiKey].penalty += cardToPenalty.value;
              
              // 从AI手牌中移除
              currentAI.handCards = currentAI.handCards.filter(card => card.id !== cardToPenalty.id);
              currentAI.cards = currentAI.handCards.length;
              
              uni.showToast({
                title: `${currentAI.name} 扣牌: ${cardToPenalty.rank}${this.getSuitSymbol(cardToPenalty.suit)} (${cardToPenalty.value}分)`,
                icon: 'none',
                duration: 2000
              });
              
              // 检查AI是否出完牌
              if (currentAI.handCards.length === 0) {
                currentAI.status = 'finished';
                this.remainingAIPlayers--;
                this.checkGameEnd();
                return;
              }
              
              // 检查游戏是否结束
              this.checkGameEnd();
              
              // 切换到下一个回合
              this.nextTurn();
            } else {
              // 如果连扣牌都找不到，直接过牌
              console.log('No penalty card found, passing');
              uni.showToast({
                title: `${currentAI.name} 选择过牌`,
                icon: 'none',
                duration: 2000
              });
              
              // 切换到下一个回合
              this.nextTurn();
            }
          }
        }
        
      }, 500); // 减少思考时间到500ms
    },
    
    // 获取当前应该出牌的AI索引
    getCurrentAIIndex() {
      console.log('getCurrentAIIndex called, currentPlayer:', this.currentPlayer);
      
      // 如果当前玩家是AI，直接返回对应的索引
      if (this.currentPlayer && this.currentPlayer.startsWith('ai')) {
        const aiNumber = parseInt(this.currentPlayer.replace('ai', ''));
        const index = aiNumber - 1;
        
        // 检查该AI是否还在游戏中
        if (index >= 0 && index < this.aiPlayers.length && this.aiPlayers[index].status === 'playing') {
          console.log('Found AI at index:', index);
          return index;
        }
      }
      
      // 如果当前玩家不是AI或AI不在游戏中，找到第一个活跃的AI
      for (let i = 0; i < this.aiPlayers.length; i++) {
        if (this.aiPlayers[i].status === 'playing') {
          console.log('Found first active AI at index:', i);
          return i;
        }
      }
      
      console.log('No active AI found');
      return -1; // 没有活跃的AI
    },
    
    // 切换到下一个回合
    nextTurn() {
      console.log('nextTurn called, currentPlayer:', this.currentPlayer);
      
      // 检查游戏是否已经结束
      if (this.gameStatus === 'ended' || this.gameStatus === 'finished') {
        console.log('Game already ended, stopping turn switching');
        return;
      }
      
      // 更新当前玩家
      this.currentPlayer = this.getNextPlayer();
      console.log('Next player:', this.currentPlayer);
      
      // 检查新玩家是否还在游戏中
      if (this.currentPlayer === 'player') {
        if (this.scores.player.status === 'playing') {
          // 切换到玩家回合
          this.isPlayerTurn = true;
          this.isAIPlayerTurn = false;
          console.log('Switched to player turn');
          
          // 更新Pass按钮状态
          this.updatePassButton();
        } else {
          // 玩家已经结束，继续下一个回合
          console.log('Player already finished, continuing to next turn');
          this.nextTurn();
        }
      } else {
        // 检查AI是否还在游戏中
        const aiIndex = this.getCurrentAIIndex();
        if (aiIndex !== -1) {
          // 切换到AI回合
          this.isPlayerTurn = false;
          this.isAIPlayerTurn = true;
          console.log('Switched to AI turn, starting AI play');
          
          // 开始AI出牌
          setTimeout(() => {
            this.aiPlay();
          }, 300);
        } else {
          // 没有活跃的AI，检查游戏结束
          console.log('No active AI found, checking game end');
          this.checkGameEnd();
        }
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
        this.gameStatus = 'finished'; // 先设置游戏状态为结束
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
      let currentIndex = players.indexOf(this.currentPlayer);
      
      // 如果当前玩家不在列表中，从第一个玩家开始
      if (currentIndex === -1) {
        currentIndex = 0;
      }
      
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
/* AI对战特有样式 - 橙白主题设计 */
.ai-container {
  padding: 16px;
  background: linear-gradient(135deg, #fff8f0 0%, #fff5eb 50%, #fff0e0 100%);
  min-height: 100vh;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  color: #333333;
}

/* AI对战模式标识 */
.ai-mode-banner {
  text-align: center;
  margin: 20px 0 30px 0;
  padding: 20px;
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 152, 0, 0.2) 100%);
  border: 2px solid #ff9800;
  border-radius: 12px;
  box-shadow: 0 0 20px rgba(255, 152, 0, 0.3);
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
  background: linear-gradient(45deg, transparent, rgba(255, 152, 0, 0.1), transparent);
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
  color: #ff9800;
  text-shadow: 0 0 10px rgba(255, 152, 0, 0.3);
  display: block;
  margin-bottom: 5px;
}

.ai-subtitle {
  font-size: 14px;
  color: #ffb74d;
  opacity: 0.8;
}

/* AI玩家状态区域 */
.ai-players-section {
  margin: 20px 0;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 152, 0, 0.3);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.ai-players-section h3 {
  margin-bottom: 16px;
  color: #ff9800;
  font-size: 18px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 152, 0, 0.3);
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
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  border: 1px solid rgba(255, 152, 0, 0.2);
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.ai-player:hover {
  background: rgba(255, 255, 255, 1);
  border-color: rgba(255, 152, 0, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
  color: #333333;
}

.ai-cards {
  font-size: 12px;
  color: #ff9800;
}

.ai-status {
  font-size: 11px;
  color: #f44336;
}

.ai-status.ai-thinking {
  color: #ff9800;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.ai-level {
  background: rgba(255, 152, 0, 0.2);
  color: #ff9800;
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
  background: rgba(255, 152, 0, 0.1);
  color: #ff9800;
  border: 2px solid #ff9800;
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
  background: rgba(255, 152, 0, 0.2);
  box-shadow: 0 0 15px rgba(255, 152, 0, 0.3);
}

.control-btn.secondary {
  background: rgba(255, 255, 255, 0.8);
  border-color: #666666;
  color: #666666;
}

.control-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(255, 152, 0, 0.4);
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
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 152, 0, 0.3);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.turn-indicator {
  padding: 16px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.your-turn {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: #ffffff;
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
  animation: glow 2s infinite;
}

.ai-turn {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
  color: #ffffff;
  box-shadow: 0 0 20px rgba(255, 152, 0, 0.5);
  animation: glow 2s infinite;
}

.other-turn {
  background: rgba(255, 255, 255, 0.9);
  color: #666666;
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 20px rgba(255, 152, 0, 0.5); }
  50% { box-shadow: 0 0 30px rgba(255, 152, 0, 0.8); }
}

/* 统计区域 */
.stats-section {
  margin: 20px 0;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 152, 0, 0.3);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stats-section h3 {
  margin-bottom: 16px;
  color: #ff9800;
  font-size: 18px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 152, 0, 0.3);
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
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  border: 1px solid rgba(255, 152, 0, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #ff9800;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: bold;
  color: #ff9800;
}

/* AI思考动画 */
.ai-thinking-animation {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  padding: 16px 24px;
  border-radius: 8px;
  border: 1px solid #ff9800;
  display: flex;
  align-items: center;
  gap: 12px;
  backdrop-filter: blur(10px);
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.thinking-dots {
  display: flex;
  gap: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  background: #ff9800;
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
  color: #ff9800;
  font-size: 14px;
}

/* 继承原有样式并适配橙白主题 */
.player-section, .cards-section, .piles-section {
  margin: 16px 0;
  padding: 16px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  border: 1px solid rgba(255, 152, 0, 0.3);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.player-section h3, .cards-section h3, .piles-section h3 {
  margin-bottom: 12px;
  color: #ff9800;
  font-size: 18px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 152, 0, 0.3);
  padding-bottom: 8px;
}

/* 卡牌样式适配橙白主题 */
.card {
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(255, 152, 0, 0.3);
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  width: 54px;
  height: 72px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.card.selected {
  border: 3px solid #ff9800;
  background: rgba(255, 152, 0, 0.1);
  box-shadow: 0 6px 0 rgba(255, 152, 0, 0.3);
}

/* 扑克牌红黑配色 */
.card-hearts .card-rank, .card-hearts .card-suit,
.card-diamonds .card-rank, .card-diamonds .card-suit { color: #d32f2f; }
.card-spades .card-rank, .card-spades .card-suit,
.card-clubs .card-rank, .card-clubs .card-suit { color: #111; }

/* 牌堆样式 - 四列分开布局 */
.piles-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 16px;
}

.pile-column {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pile-item {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pile {
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(255, 152, 0, 0.3);
  border-radius: 12px;
  padding: 12px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.pile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 152, 0, 0.2);
}

.pile-suit {
  font-size: 20px;
  font-weight: bold;
}

.pile-count {
  font-size: 12px;
  color: #ff9800;
  background: rgba(255, 152, 0, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.pile-cards {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
  min-height: 120px;
}

.pile-sequence {
  position: relative;
  height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 牌堆里的牌适配同样样式 */
.pile-card.card { 
  width: 40px; 
  height: 56px; 
  border-radius: 6px; 
  position: absolute;
  transition: all 0.3s ease;
}

.pile-player {
  font-size: 10px;
  color: #ff9800;
  margin-top: 8px;
  text-align: center;
  opacity: 0.8;
}

/* 按钮样式适配 */
.play-btn {
  background: rgba(76, 175, 80, 0.2);
  border-color: #4caf50;
  color: #4caf50;
}

.clear-btn {
  background: rgba(244, 67, 54, 0.2);
  border-color: #f44336;
  color: #f44336;
}

.pass-btn {
  background: rgba(255, 152, 0, 0.2);
  border-color: #ff9800;
  color: #ff9800;
}

/* 返回按钮样式 */
.back-button {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid #ff9800;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 10px rgba(255, 152, 0, 0.3);
  z-index: 10;
  backdrop-filter: blur(10px);
}

.back-button:active {
  transform: translateY(1px);
  box-shadow: 0 0 5px rgba(255, 152, 0, 0.3);
}

.back-text {
  font-size: 14px;
  font-weight: bold;
  color: #ff9800;
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