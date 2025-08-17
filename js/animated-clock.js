// Animated Clock for Fantasy Messenger
// Uses requestAnimationFrame for smooth animations and broadcasts time to all users

class AnimatedClock {
	constructor(socket = null) {
		this.socket = socket;
		this.isAnimating = false;
		this.animationId = null;
		this.lastUpdate = 0;
		this.updateInterval = 1000; // Update every second
		this.timeOffset = 0; // Server time offset
		
		// DOM elements
		this.clockElements = {
			hours: null,
			minutes: null,
			seconds: null,
			day: null,
			dateText: null,
			timeElement: null
		};
		
		// Animation properties
		this.animationState = {
			isFlashing: false,
			flashCount: 0,
			maxFlashes: 3
		};
		
		this.initializeElements();
		this.setupSocketListeners();
		this.start();
	}

	initializeElements() {
		// Cache DOM elements for performance
		this.clockElements = {
			hours: document.getElementById('clock-hours'),
			minutes: document.getElementById('clock-minutes'),
			seconds: document.getElementById('clock-seconds'),
			day: document.getElementById('clock-day'),
			dateText: document.getElementById('clock-date-text'),
			timeElement: document.getElementById('clock-time')
		};
	}

	setupSocketListeners() {
		if (!this.socket) return;

		// Listen for server time synchronization
		this.socket.on('time-sync', (data) => {
			this.synchronizeTime(data);
		});

		// Listen for time broadcast from other users
		this.socket.on('time-broadcast', (data) => {
			this.handleTimeBroadcast(data);
		});

		// Request initial time sync
		this.socket.emit('request-time-sync');
	}

	synchronizeTime(serverData) {
		const { serverTime, timezone } = serverData;
		const clientTime = Date.now();
		this.timeOffset = serverTime - clientTime;
		
		// Flash animation to indicate sync
		this.triggerSyncAnimation();
	}

	handleTimeBroadcast(data) {
		const { timestamp, username, action } = data;
		
		// Show visual indicator of time broadcast
		if (action === 'time-shared') {
			this.triggerShareAnimation();
		}
	}

	getCurrentTime() {
		// Use server-synchronized time if available
		return new Date(Date.now() + this.timeOffset);
	}

	formatTime(date) {
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');
		const seconds = date.getSeconds().toString().padStart(2, '0');
		
		return { hours, minutes, seconds };
	}

	formatDate(date) {
		const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		
		const dayName = days[date.getDay()];
		const month = months[date.getMonth()];
		const day = date.getDate();
		const year = date.getFullYear();
		
		return {
			dayName,
			dateText: `${month} ${day}, ${year}`
		};
	}

	updateDisplay(timestamp) {
		// Throttle updates to once per second for performance
		if (timestamp - this.lastUpdate < this.updateInterval) {
			return;
		}
		
		this.lastUpdate = timestamp;
		
		const now = this.getCurrentTime();
		const time = this.formatTime(now);
		const date = this.formatDate(now);
		
		// Update time elements with smooth transitions
		this.updateTimeElement('hours', time.hours);
		this.updateTimeElement('minutes', time.minutes);
		this.updateTimeElement('seconds', time.seconds);
		
		// Update date elements
		if (this.clockElements.day) {
			this.clockElements.day.textContent = date.dayName;
		}
		
		if (this.clockElements.dateText) {
			this.clockElements.dateText.textContent = date.dateText;
		}
		
		// Update datetime attribute for accessibility
		if (this.clockElements.timeElement) {
			this.clockElements.timeElement.setAttribute('datetime', now.toISOString());
		}
		
		// Broadcast time update to other users (throttled)
		this.broadcastTime(now);
	}

	updateTimeElement(type, value) {
		const element = this.clockElements[type];
		if (!element) return;
		
		const currentValue = element.textContent;
		if (currentValue !== value) {
			// Add animation class for smooth transition
			element.style.transform = 'scale(1.1)';
			element.style.color = 'oklch(60% 0.15 250)';
			
			// Update value
			element.textContent = value;
			
			// Reset animation after short delay
			setTimeout(() => {
				element.style.transform = 'scale(1)';
				element.style.color = '';
			}, 150);
		}
	}

	broadcastTime(currentTime) {
		// Only broadcast every 10 seconds to avoid spam
		if (this.socket && currentTime.getSeconds() % 10 === 0) {
			this.socket.emit('time-update', {
				timestamp: currentTime.getTime(),
				timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
			});
		}
	}

	triggerSyncAnimation() {
		if (!this.clockElements.timeElement) return;
		
		this.animationState.isFlashing = true;
		this.animationState.flashCount = 0;
		
		const flashInterval = setInterval(() => {
			if (this.animationState.flashCount >= this.animationState.maxFlashes) {
				clearInterval(flashInterval);
				this.animationState.isFlashing = false;
				this.clockElements.timeElement.style.backgroundColor = '';
				return;
			}
			
			// Alternate between highlight and normal
			const isHighlighted = this.animationState.flashCount % 2 === 0;
			this.clockElements.timeElement.style.backgroundColor = 
				isHighlighted ? 'oklch(80% 0.1 120)' : '';
			
			this.animationState.flashCount++;
		}, 200);
	}

	triggerShareAnimation() {
		if (!this.clockElements.timeElement) return;
		
		// Pulse animation for time sharing
		this.clockElements.timeElement.style.boxShadow = '0 0 10px oklch(60% 0.15 250)';
		
		setTimeout(() => {
			this.clockElements.timeElement.style.boxShadow = '';
		}, 1000);
	}

	animate(timestamp) {
		if (!this.isAnimating) return;
		
		this.updateDisplay(timestamp);
		this.animationId = requestAnimationFrame((ts) => this.animate(ts));
	}

	start() {
		if (this.isAnimating) return;
		
		this.isAnimating = true;
		this.animationId = requestAnimationFrame((ts) => this.animate(ts));
	}

	stop() {
		if (!this.isAnimating) return;
		
		this.isAnimating = false;
		if (this.animationId) {
			cancelAnimationFrame(this.animationId);
			this.animationId = null;
		}
	}

	restart() {
		this.stop();
		setTimeout(() => this.start(), 100);
	}

	// Public method to share current time with other users
	shareTime() {
		if (!this.socket) return;
		
		const currentTime = this.getCurrentTime();
		this.socket.emit('share-time', {
			timestamp: currentTime.getTime(),
			formattedTime: this.formatTime(currentTime),
			formattedDate: this.formatDate(currentTime)
		});
		
		this.triggerShareAnimation();
	}

	// Cleanup method
	destroy() {
		this.stop();
		if (this.socket) {
			this.socket.off('time-sync');
			this.socket.off('time-broadcast');
		}
	}
}

// Performance monitoring
class ClockPerformanceMonitor {
	constructor(clock) {
		this.clock = clock;
		this.frameCount = 0;
		this.lastFpsUpdate = 0;
		this.fps = 0;
		this.averageFrameTime = 0;
		this.frameTimes = [];
		this.maxFrameTimes = 60; // Keep last 60 frame times
	}

	measureFrame(timestamp) {
		this.frameCount++;
		
		// Calculate frame time
		if (this.lastFpsUpdate > 0) {
			const frameTime = timestamp - this.lastFpsUpdate;
			this.frameTimes.push(frameTime);
			
			// Keep only recent frame times
			if (this.frameTimes.length > this.maxFrameTimes) {
				this.frameTimes.shift();
			}
			
			// Calculate average frame time
			this.averageFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
		}
		
		// Update FPS every second
		if (timestamp - this.lastFpsUpdate >= 1000) {
			this.fps = this.frameCount;
			this.frameCount = 0;
			this.lastFpsUpdate = timestamp;
			
			// Log performance if needed (debug mode)
			if (window.DEBUG_CLOCK) {
				console.log(`Clock FPS: ${this.fps}, Avg Frame Time: ${this.averageFrameTime.toFixed(2)}ms`);
			}
		}
	}

	getPerformanceData() {
		return {
			fps: this.fps,
			averageFrameTime: this.averageFrameTime,
			frameCount: this.frameCount
		};
	}
}

// Export for module use
export { AnimatedClock, ClockPerformanceMonitor };

// Global instance (will be initialized in chat.js)
window.AnimatedClock = AnimatedClock;