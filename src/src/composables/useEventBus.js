import { ref } from 'vue';

// Создаем глобальный event bus
const eventBus = {
    events: new Map(),
    
    // Подписка на событие
    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(callback);
    },
    
    // Отписка от события
    off(event, callback) {
        if (this.events.has(event)) {
            const callbacks = this.events.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    },
    
    // Отправка события
    emit(event, data) {
        if (this.events.has(event)) {
            this.events.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in event callback:', error);
                }
            });
        }
    }
};

// События для обновления данных
export const EVENTS = {
    POST_CREATED: 'post:created',
    POST_UPDATED: 'post:updated',
    POST_DELETED: 'post:deleted',
    POST_PUBLISHED: 'post:published',
    POST_UNPUBLISHED: 'post:unpublished',
    SCHEDULED_POST_CREATED: 'scheduled-post:created',
    SCHEDULED_POST_UPDATED: 'scheduled-post:updated',
    SCHEDULED_POST_DELETED: 'scheduled-post:deleted',
    SCHEDULED_POST_CANCELLED: 'scheduled-post:cancelled',
    CATEGORY_CREATED: 'category:created',
    CATEGORY_UPDATED: 'category:updated',
    CATEGORY_DELETED: 'category:deleted',
    CHANNEL_CREATED: 'channel:created',
    CHANNEL_UPDATED: 'channel:updated',
    CHANNEL_DELETED: 'channel:deleted',
    REFRESH_POSTS: 'refresh:posts',
    REFRESH_SCHEDULED_POSTS: 'refresh:scheduled-posts',
    REFRESH_CATEGORIES: 'refresh:categories',
    REFRESH_CHANNELS: 'refresh:channels'
};

export function useEventBus() {
    return {
        eventBus,
        EVENTS,
        
        // Подписка на событие
        on(event, callback) {
            eventBus.on(event, callback);
        },
        
        // Отписка от события
        off(event, callback) {
            eventBus.off(event, callback);
        },
        
        // Отправка события
        emit(event, data) {
            eventBus.emit(event, data);
        }
    };
}

export default eventBus; 