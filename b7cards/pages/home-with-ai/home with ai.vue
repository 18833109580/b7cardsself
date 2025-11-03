<template>
  <view class="container">
    <!-- 返回按钮 -->
    <view class="back-button" @click="goBack">
      <text class="back-text">← 返回菜单</text>
    </view>
    
    <!-- AI对战模式标识 -->
    <view class="ai-mode-banner">
      <view class="ai-icon">🤖</view>
      <text class="ai-text">AI对战模式</text>
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
        </view>
      </view>
    </view>
    
    <!-- 游戏控制按钮 -->
    <view class="control-section">
      <button @click="SynInformation" :disabled="!canbutton">同步信息</button>
      <button @click="startAIGame" :disabled="!canbutton">开始AI对战</button>
      <button @click="restartAIGame" :disabled="gameStatus !== 'playing'">重新开始</button>
    </view>
    
    <!-- 出牌权显示 -->
    <view class="turn-section" v-if="gameStatus === 'playing' && currentPlayer">
      <view :class="['turn-indicator', isYourTurn ? 'your-turn' : 'other-turn']">
        <text v-if="isYourTurn" class="turn-text">🎮 轮到您出牌</text>
        <text v-else-if="isAIPlayerTurn" class="turn-text">🤖 轮到AI玩家 {{ currentPlayer }} 出牌</text>
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
      </view>
    </view>
    
  </view>
</template>

<script>
const app = getApp();
export default {
  
	data(){
		return{
			canbutton : false,
			isConnected : false ,
			playerlist:[],
			playerCards: [],
			selectedCard: null, // 选中的单张牌
			gameStatus: 'waiting', // waiting, playing, ended
			gamePiles: {
				hearts: { suit: 'hearts', count: 0, topCard: null, playedBy: null, cards: [] },
				spades: { suit: 'spades', count: 0, topCard: null, playedBy: null, cards: [] },
				diamonds: { suit: 'diamonds', count: 0, topCard: null, playedBy: null, cards: [] },
				clubs: { suit: 'clubs', count: 0, topCard: null, playedBy: null, cards: [] }
			},
			currentPlayer: null, // 当前出牌玩家
			isYourTurn: false, // 是否轮到当前玩家出牌
			canPass: false, // 是否可以pass
			passHint: '', // pass提示信息
      
      // AI对战特有数据
      aiPlayers: [
        { name: 'AI玩家1', cards: 0, isThinking: false },
        { name: 'AI玩家2', cards: 0, isThinking: false }
      ],
      isAIPlayerTurn: false, // 是否是AI玩家回合
      gameRounds: 0, // 游戏回合数
      aiPlayCount: 0, // AI出牌次数
      remainingAIPlayers: 2 // 剩余AI玩家数量
		}
	},
  onLoad(){
    this.setupWebSocketListener();
  },
  methods: {
    // 返回菜单
    goBack() {
      uni.navigateTo({
        url: '/pages/menu/menu'
      });
    },
    
    setupWebSocketListener() {
      if (app.globalData.socketTask && app.globalData.isConnected) {
		  console.log("AI对战页面监听器设置成功")
		  this.canbutton = true;
        // 设置消息监听器
        app.globalData.socketTask.onMessage((res) => {
          console.log('AI对战页面收到WebSocket消息:', res);
          
          try {
            // 解析JSON消息
            const messageData = JSON.parse(res.data);
            
            if(messageData.type == 'syninformation'){
				console.log("进入到同步数组if")
              this.playerlist = messageData.content;
            }
            
            // 处理开始游戏后的消息处理
            if(messageData.type == 'alert'){
				console.log(messageData.content)
				uni.showToast({
					title:messageData.content,
					icon:'error',
					duration:2000
				})
			}
			
            if(messageData.type == "gameStartRes"){
				console.log("收到游戏开始响应，手牌信息:", messageData.content);
				this.playerCards = messageData.content.playerCards || [];
				this.gameStatus = 'playing';
				this.selectedCard = null;
				// 初始化牌堆
				this.gamePiles = {
					hearts: { suit: 'hearts', count: 0, topCard: null, playedBy: null, cards: [] },
					spades: { suit: 'spades', count: 0, topCard: null, playedBy: null, cards: [] },
					diamonds: { suit: 'diamonds', count: 0, topCard: null, playedBy: null, cards: [] },
					clubs: { suit: 'clubs', count: 0, topCard: null, playedBy: null, cards: [] }
				};
				// 设置当前出牌玩家
				this.currentPlayer = messageData.content.currentPlayer;
				this.isYourTurn = this.currentPlayer === app.globalData.diviceid;
              this.isAIPlayerTurn = this.currentPlayer && this.currentPlayer.startsWith('AI');
				// 检查是否可以Pass
				this.checkCanPass();
              
              // 初始化AI玩家状态
              this.initializeAIPlayers();
				
				uni.showToast({
					title: `AI对战开始！获得${this.playerCards.length}张牌`,
					icon: 'success',
					duration: 2000
				});
			}
			
            // 处理AI出牌消息
			if(messageData.type == "aiPlayCard"){
				console.log("AI出牌:", messageData.content);
				// 更新牌堆信息
				if(messageData.content.pileInfo) {
					this.gamePiles = messageData.content.pileInfo;
				}
				// 更新当前出牌玩家
				if(messageData.content.currentPlayer) {
					this.currentPlayer = messageData.content.currentPlayer;
					this.isYourTurn = this.currentPlayer === app.globalData.diviceid;
                    this.isAIPlayerTurn = this.currentPlayer && this.currentPlayer.startsWith('AI');
					this.checkCanPass();
				}
                
                // 更新AI玩家状态
                this.updateAIPlayerStatus(messageData.content.aiPlayer, messageData.content.card);
				
				uni.showToast({
					title: `AI玩家 ${messageData.content.aiPlayer} 出牌: ${messageData.content.card.rank}${this.getSuitSymbol(messageData.content.card.suit)}`,
					icon: 'none',
					duration: 2000
				});
			}
			
			// 处理牌堆更新消息
			if(messageData.type == "pileUpdate"){
				console.log("收到牌堆更新消息:", messageData.content);
				this.gamePiles = messageData.content.pileInfo;
				
				// 更新当前出牌玩家
				if(messageData.content.currentPlayer) {
					this.currentPlayer = messageData.content.currentPlayer;
					this.isYourTurn = this.currentPlayer === app.globalData.diviceid;
                    this.isAIPlayerTurn = this.currentPlayer && this.currentPlayer.startsWith('AI');
					// 检查是否可以Pass
					this.checkCanPass();
				}
				
				// 更新玩家手牌数量
				if(messageData.content.remainingCards !== undefined) {
					// 如果是当前玩家的出牌，更新手牌
					if(messageData.content.playedBy === app.globalData.diviceid) {
						this.playerCards = this.playerCards.filter(card => 
							card.id !== messageData.content.playedCard.id
						);
						this.selectedCard = null;
					}
				}
                
                // 更新游戏回合
                this.gameRounds++;
			}
			
			// 处理出牌成功消息
			if(messageData.type == "playCardSuccess"){
				console.log("出牌成功:", messageData.content);
				uni.showToast({
					title: messageData.content,
					icon: 'success',
					duration: 2000
				});
			}
			
			// 处理出牌失败消息
			if(messageData.type == "playCardFail"){
				console.log("出牌失败:", messageData.content);
				uni.showToast({
					title: messageData.content,
					icon: 'error',
					duration: 2000
				});
			}
			
			// 处理Pass成功消息
			if(messageData.type == "passSuccess"){
				console.log("Pass成功:", messageData.content);
				
				// 更新当前出牌玩家
				if(messageData.content.nextPlayer) {
					this.currentPlayer = messageData.content.nextPlayer;
					this.isYourTurn = this.currentPlayer === app.globalData.diviceid;
                    this.isAIPlayerTurn = this.currentPlayer && this.currentPlayer.startsWith('AI');
					// 检查是否可以Pass
					this.checkCanPass();
				}
				
				uni.showToast({
					title: messageData.content.message,
					icon: 'success',
					duration: 2000
				});
			}
			
			// 处理Pass失败消息
			if(messageData.type == "passFail"){
				console.log("Pass失败:", messageData.content);
				uni.showToast({
					title: messageData.content,
					icon: 'error',
					duration: 2000
				});
			}
		 
		  } catch (error) {
            console.error('消息解析失败:', error, '原始数据:', res.data);
            // 处理非JSON格式消息
            
          }
        });
        
        this.isListening = true;
        console.log('AI对战页面WebSocket监听器已设置');
      } else {
        console.log('WebSocket未连接，无法设置监听器');
        // 可以设置定时器重试
        setTimeout(() => {
          this.setupWebSocketListener();
        }, 2000);
      }
    },
    
    // 初始化AI玩家状态
    initializeAIPlayers() {
      this.aiPlayers = [
        { name: 'AI玩家1', cards: 7, isThinking: false },
        { name: 'AI玩家2', cards: 7, isThinking: false }
      ];
      this.gameRounds = 0;
      this.aiPlayCount = 0;
      this.remainingAIPlayers = 2;
    },
    
    // 更新AI玩家状态
    updateAIPlayerStatus(aiPlayer, card) {
      const aiIndex = this.aiPlayers.findIndex(ai => ai.name === aiPlayer);
      if (aiIndex !== -1) {
        // 减少AI手牌数量
        this.aiPlayers[aiIndex].cards = Math.max(0, this.aiPlayers[aiIndex].cards - 1);
        
        // 显示思考状态
        this.aiPlayers[aiIndex].isThinking = true;
        this.aiPlayCount++;
        
        // 2秒后取消思考状态
        setTimeout(() => {
          this.aiPlayers[aiIndex].isThinking = false;
        }, 2000);
        
        // 检查AI是否出完牌
        if (this.aiPlayers[aiIndex].cards === 0) {
          this.remainingAIPlayers--;
          uni.showToast({
            title: `${aiPlayer} 已出完所有牌！`,
            icon: 'success',
            duration: 2000
          });
        }
      }
    },
    
    SynInformation(){
		console.log("是否成功连接" + app.globalData.isConnected);
		console.log("socketTask:" + app.globalData.socketTask);
      if (app.globalData.isConnected && app.globalData.socketTask) {
					const message = {
						type: 'system',
						reqmethoud : 'syninformation',
						playerid : app.globalData.diviceid,
            
					};
					
					app.globalData.socketTask.send({
						data: JSON.stringify(message),
						success: () => {
							//----------在连接成功的回调中设置监听函数-------------------------
							this.isConnected = true
							console.log('同步信息成功');
							
							
						},
						fail: (err) => {
							console.error('同步用户信息失败:', err);
							
						}
					});
				} else {
					uni.showToast({
						title: 'WebSocket未连接',
						icon: 'none'
					});
				}
    },
    
    startAIGame(){
		const message = {
			type: 'startAIGame',
			reqmethoud : 'user',
			playerid : app.globalData.diviceid,
		            };
			app.globalData.socketTask.send({
				data: JSON.stringify(message),
				success: () => {
					//----------在连接成功的回调中设置监听函数-------------------------
					this.isConnected = true
					console.log('发送AI游戏开始请求');
					
					
				},
				fail: (err) => {
					console.error('发送AI游戏开始请求失败:', err);
							
				}
			});
		
	},
    
    // 重新开始AI对战
    restartAIGame() {
      uni.showModal({
        title: '重新开始',
        content: '确定要重新开始AI对战吗？',
        success: (res) => {
          if (res.confirm) {
            this.startAIGame();
          }
        }
      });
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
      if (this.selectedCard && this.selectedCard.id === card.id) {
        // 如果点击的是已选中的牌，则取消选择
        this.selectedCard = null;
      } else {
        // 选择新的牌
        this.selectedCard = card;
      }
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
      
      console.log('出牌:', this.selectedCard);
      
      // 发送出牌消息到服务器
      const message = {
        type: 'playCard',
        playerid: app.globalData.diviceid,
        card: this.selectedCard,
		
      };
      
      app.globalData.socketTask.send({
        data: JSON.stringify(message),
        success: () => {
          console.log('出牌请求发送成功，等待服务器验证');
          // 不再立即移除手牌，等待服务器确认
          // 手牌移除和牌堆更新将在收到服务器确认消息后处理
        },
        fail: (err) => {
          console.error('出牌请求发送失败:', err);
          uni.showToast({
            title: '出牌请求发送失败',
            icon: 'none',
            duration: 2000
          });
        }
      });
    },
    
    // Pass操作
    passTurn() {
      if (!this.isYourTurn) {
        uni.showToast({
          title: '现在不是你的回合',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      
      console.log('玩家选择Pass');
      
      // 发送Pass消息到服务器
      const message = {
        type: 'passTurn',
        playerid: app.globalData.diviceid
      };
      
      app.globalData.socketTask.send({
        data: JSON.stringify(message),
        success: () => {
          console.log('Pass请求发送成功');
        },
        fail: (err) => {
          console.error('Pass请求发送失败:', err);
          uni.showToast({
            title: 'Pass请求发送失败',
            icon: 'none',
            duration: 2000
          });
        }
      });
    },
    
    // 检查是否可以Pass
    checkCanPass() {
      if (!this.isYourTurn || this.gameStatus !== 'playing') {
        this.canPass = false;
        this.passHint = '';
        return;
      }
      // 简化规则：所有玩家都可以Pass
      this.canPass = true;
      this.passHint = '可以Pass';
    }
  }
}
</script>

<style>
/* 橙白配色像素风格 */
.container {
  padding: 16px;
  background: linear-gradient(135deg, #fff5e6 0%, #fff 100%);
  min-height: 100vh;
  font-family: 'Courier New', monospace;
}

/* AI对战模式标识 */
.ai-mode-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff8c00 0%, #ff6b35 100%);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  margin: 16px 0;
  box-shadow: 0 4px 8px rgba(255, 140, 0, 0.3);
}

.ai-icon {
  font-size: 24px;
  margin-right: 8px;
}

.ai-text {
  font-size: 18px;
  font-weight: bold;
}

/* AI玩家状态区域 */
.ai-players-section {
  margin: 16px 0;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 2px solid #ff8c00;
  box-shadow: 0 4px 0 #e67300;
}

.ai-players-section h3 {
  margin-bottom: 12px;
  color: #ff8c00;
  font-size: 18px;
  text-align: center;
  border-bottom: 2px solid #ff8c00;
  padding-bottom: 8px;
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
  background: #fff5e6;
  border-radius: 6px;
  border: 1px solid #ffd699;
}

.ai-avatar {
  font-size: 32px;
  margin-right: 12px;
}

.ai-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.ai-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.ai-cards {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.ai-status {
  font-size: 12px;
  color: #888;
}

.ai-thinking {
  color: #ff8c00;
  font-weight: bold;
  animation: thinking 1s infinite;
}

@keyframes thinking {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 控制按钮区域 */
.control-section {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 16px 0;
  flex-wrap: wrap;
}

/* 统计区域 */
.stats-section {
  margin: 16px 0;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 2px solid #ff8c00;
  box-shadow: 0 4px 0 #e67300;
}

.stats-section h3 {
  margin-bottom: 12px;
  color: #ff8c00;
  font-size: 18px;
  text-align: center;
  border-bottom: 2px solid #ff8c00;
  padding-bottom: 8px;
}

.stats-container {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #ff8c00;
}

/* 按钮样式 - 像素风格 */
button {
  background: #ff8c00;
  color: white;
  border: 2px solid #e67300;
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 0 #cc6600;
  margin: 8px 4px;
  font-family: 'Courier New', monospace;
}

button:disabled {
  background: #ccc;
  border-color: #999;
  box-shadow: 0 4px 0 #999;
  cursor: not-allowed;
  opacity: 0.6;
}

button:not(:disabled):active {
  transform: translateY(4px);
  box-shadow: 0 0 0 #cc6600;
}

/* 玩家列表样式 */
.player-section {
  margin: 16px 0;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 2px solid #ff8c00;
  box-shadow: 0 4px 0 #e67300;
}

.player-section h3 {
  margin-bottom: 12px;
  color: #ff8c00;
  font-size: 18px;
  text-align: center;
  border-bottom: 2px solid #ff8c00;
  padding-bottom: 8px;
}

/* 手牌区域样式 */
.cards-section {
  margin: 16px 0;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 2px solid #ff8c00;
  box-shadow: 0 4px 0 #e67300;
}

.cards-section h3 {
  margin-bottom: 16px;
  color: #ff8c00;
  font-size: 18px;
  text-align: center;
  border-bottom: 2px solid #ff8c00;
  padding-bottom: 8px;
}

.cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.card-item {
  width: 64px;
  height: 88px;
}

/* 卡牌样式 - 像素风格 */
.card {
  width: 100%;
  height: 100%;
  border: 2px solid #333;
  border-radius: 6px;
  background: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 0 #666;
}

.card.selected {
  border: 3px solid #ff8c00;
  background: #fff5e6;
  transform: translateY(-4px);
  box-shadow: 0 6px 0 #e67300;
}

.card-hearts {
  color: #e74c3c;
  border-color: #e74c3c;
}

.card-diamonds {
  color: #e74c3c;
  border-color: #e74c3c;
}

.card-spades {
  color: #2c3e50;
  border-color: #2c3e50;
}

.card-clubs {
  color: #2c3e50;
  border-color: #2c3e50;
}

.card-rank {
  font-size: 18px;
  font-weight: bold;
}

.card-suit {
  font-size: 24px;
  margin-top: 4px;
}

.selected-mark {
  position: absolute;
  top: 4px;
  right: 4px;
  color: #ff8c00;
  font-weight: bold;
  font-size: 14px;
}

/* 选中牌区域 */
.selected-section {
  margin-bottom: 20px;
  padding: 16px;
  background: #fff5e6;
  border-radius: 8px;
  border: 2px solid #ff8c00;
  text-align: center;
}

.selected-section h4 {
  margin-bottom: 12px;
  color: #ff8c00;
  font-size: 16px;
}

.selected-cards {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.play-btn {
  background: #4CAF50;
  border-color: #45a049;
  box-shadow: 0 4px 0 #3d8b40;
}

.clear-btn {
  background: #ff6b6b;
  border-color: #ff5252;
  box-shadow: 0 4px 0 #ff3838;
}

/* Pass按钮样式 */
.pass-section {
  margin-top: 16px;
  padding: 16px;
  background: #fff5e6;
  border-radius: 8px;
  border: 2px solid #ff8c00;
  text-align: center;
}

.pass-btn {
  background: #ff8c00;
  border-color: #e67300;
  box-shadow: 0 4px 0 #cc6600;
  font-size: 16px;
  padding: 12px 24px;
}

.pass-hint {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #ff8c00;
  font-style: italic;
}

/* 出牌权显示样式 */
.turn-section {
  margin: 16px 0;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  background: white;
  border: 2px solid #ff8c00;
  box-shadow: 0 4px 0 #e67300;
}

.turn-indicator {
  padding: 12px 20px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.your-turn {
  background: #ff8c00;
  color: white;
  box-shadow: 0 4px 0 #e67300;
  animation: pixelPulse 1s infinite;
}

.other-turn {
  background: #ffb366;
  color: #333;
  box-shadow: 0 4px 0 #e67300;
}

.turn-text {
  font-size: 16px;
}

@keyframes pixelPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* 牌堆样式 - 只在有牌时显示 */
.piles-section {
  margin: 16px 0;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 2px solid #ff8c00;
  box-shadow: 0 4px 0 #e67300;
}

.piles-section h3 {
  margin-bottom: 16px;
  color: #ff8c00;
  font-size: 18px;
  text-align: center;
  border-bottom: 2px solid #ff8c00;
  padding-bottom: 8px;
}

.piles-container {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  gap: 20px;
  overflow-x: auto;
  padding: 8px 0;
  min-height: 120px;
}

.pile-item {
  flex-shrink: 0;
}

.pile {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
}

.pile-hearts {
  border-color: #e74c3c;
  background: #ffeaea;
}

.pile-diamonds {
  border-color: #e74c3c;
  background: #ffeaea;
}

.pile-spades {
  border-color: #2c3e50;
  background: #f0f0f0;
}

.pile-clubs {
  border-color: #2c3e50;
  background: #f0f0f0;
}

.pile-suit {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.pile-count {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.pile-top-card {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 2px;
}

.pile-empty {
  font-size: 12px;
  color: #999;
  font-style: italic;
}

.pile-player {
  font-size: 10px;
  color: #888;
  text-align: center;
}

/* 牌堆标题样式 */
.pile-header {
  text-align: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.pile-suit {
  font-size: 20px;
  font-weight: bold;
  margin-right: 8px;
}

.pile-count {
  font-size: 12px;
  color: #666;
}

/* 牌堆序列样式 - 斗地主式横向叠放 */
.pile-cards {
  width: 100%;
  min-height: 80px;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
}

.pile-sequence {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  min-height: 80px;
  position: relative;
}

/* 牌堆中的单张牌样式 */
.pile-card {
  width: 50px;
  height: 70px;
  border: 2px solid #333;
  border-radius: 4px;
  background: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}

.pile-card-hearts {
  color: #e74c3c;
  border-color: #e74c3c;
}

.pile-card-diamonds {
  color: #e74c3c;
  border-color: #e74c3c;
}

.pile-card-spades {
  color: #2c3e50;
  border-color: #2c3e50;
}

.pile-card-clubs {
  color: #2c3e50;
  border-color: #2c3e50;
}

.pile-card .card-rank {
  font-size: 14px;
  font-weight: bold;
}

.pile-card .card-suit {
  font-size: 18px;
  margin-top: 2px;
}

.pile-card.seven-card {
  background: #ffeb3b;
  font-weight: bold;
  border-color: #ff8c00;
  box-shadow: 0 4px 8px rgba(255, 140, 0, 0.3);
  z-index: 10;
}

/* 空牌堆样式 */
.pile-empty {
  font-size: 14px;
  color: #999;
  font-style: italic;
  text-align: center;
  margin-top: 30px;
}

/* 最后出牌者信息 */
.pile-player {
  font-size: 10px;
  color: #888;
  text-align: center;
  margin-top: 8px;
}

/* 列表样式 */
ul {
  list-style-type: none;
  padding: 0;
}

li {
  padding: 6px 0;
  border-bottom: 1px solid #eee;
  text-align: center;
}

/* 返回按钮样式 */
.back-button {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid #ff8c00;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.back-button:active {
  transform: translateY(1px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.back-text {
  font-size: 14px;
  font-weight: bold;
  color: #ff8c00;
  font-family: 'Courier New', monospace;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 12px;
  }
  
  .piles-container {
    grid-template-columns: 1fr;
  }
  
  .card-item {
    width: 56px;
    height: 80px;
  }
  
  .back-button {
    top: 10px;
    left: 10px;
    padding: 6px 12px;
  }
  
  .back-text {
    font-size: 12px;
  }
  
  .ai-players-container {
    flex-direction: column;
  }
  
  .stats-container {
    flex-direction: column;
    gap: 12px;
  }
}
</style>