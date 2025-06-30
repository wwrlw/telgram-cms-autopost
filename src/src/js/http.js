import axios from "axios";

const instance = axios.create({
    baseURL: 'http://127.0.0.1:3001'
});

instance.interceptors.response.use(
    (response) => {
        if (response.data.error) {
            if (response.data.codes && response.data.codes.field == "notify") {
                window._notify(
                    "error",
                    window._t(
                        response.data.codes.code,
                        response.data.codes.info || {}
                    )
                );
            }
        }
        return response;
    },
    (error) => {
        return Promise.reject(error);
    }
);

instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

let http = {
    posts: function (params = {}, callback, errorCallback) {
        const queryParams = new URLSearchParams();
        
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.text) queryParams.append('text', params.text);
        if (params.is_unique !== undefined) queryParams.append('is_unique', params.is_unique);
        if (params.source_channel) queryParams.append('source_channel', params.source_channel);
        if (params.date_from) queryParams.append('date_from', params.date_from);
        if (params.date_to) queryParams.append('date_to', params.date_to);
        if (params.sort_field) queryParams.append('sort_field', params.sort_field);
        if (params.sort_order) queryParams.append('sort_order', params.sort_order);
        
        const url = queryParams.toString() ? `/posts?${queryParams.toString()}` : '/posts';
        
        instance.get(url)
          .then((res) => {
            callback(res.data);
          })
          .catch((err) => {
            if (errorCallback) errorCallback(err);
          });
    },
    post: function (params, callback) {
        instance.get(`/post/${params.id}`) 
        .then((res) => {
            callback(res.data);
        })
        .catch((err) => {
            callback({ success: false, message: 'Failed to load post' });
        });
    },
    login: function (params, callback) {
        instance.post('/auth/login', params)
        .then((res) => {
            callback(res.data);
        })
        .catch((err) => {
            const errorMessage = err.response?.data?.message || 'Network error occurred';
            callback({ success: false, message: errorMessage });
        });
    },
    register: function (params, callback) {
        instance.post('/auth/register', params)
        .then((res) => {
            callback(res.data);
        })
        .catch((err) => {
            const errorMessage = err.response?.data?.message || 'Registration failed';
            callback({ success: false, message: errorMessage });
        });
    },
    
    channels: function (params = {}, callback, errorCallback) {
        const queryParams = new URLSearchParams();
        
        if (params.search) queryParams.append('search', params.search);
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        
        const url = queryParams.toString() ? `/channels?${queryParams.toString()}` : '/channels';
        
        instance.get(url)
        .then((res) => {
            callback(res.data);
        })
        .catch((err) => {
            if (errorCallback) errorCallback(err);
            else callback({ success: false, message: 'Failed to load channels' });
        });
    },
    
    createChannel: function (params, callback) {
        instance.post('/channels', params)
        .then((res) => {
            callback(res.data);
        })
        .catch((err) => {
            const errorMessage = err.response?.data?.message || 'Failed to create channel';
            callback({ success: false, message: errorMessage });
        });
    },
    
    updateChannel: function (params, callback) {
        const { id, ...updateData } = params;
        instance.put(`/channels/${id}`, updateData)
        .then((res) => {
            callback(res.data);
        })
        .catch((err) => {
            const errorMessage = err.response?.data?.message || 'Failed to update channel';
            callback({ success: false, message: errorMessage });
        });
    },
    
    deleteChannel: function (params, callback) {
        instance.delete(`/channels/${params.id}`)
        .then((res) => {
            callback(res.data);
        })
        .catch((err) => {
            const errorMessage = err.response?.data?.message || 'Failed to delete channel';
            callback({ success: false, message: errorMessage });
        });
    },

    deletePost: function (params, callback) {
        instance.delete(`/post/${params.id}`)
        .then((res) => {
            callback(res.data);
        })
        .catch((err) => {
            const errorMessage = err.response?.data?.message || 'Failed to delete post';
            callback({ success: false, message: errorMessage });
        });
    },

    getPostedChannels: function (callback) {
        instance.get('/posted-channels/active')
        .then((res) => {
            callback(res.data);
        })
        .catch((err) => {
            const errorMessage = err.response?.data?.message || 'Failed to load posted channels';
            callback({ success: false, message: errorMessage });
        });
    },

    publishToChannel: function (postId, channelId, callback) {
        instance.post(`/publish/${postId}/${channelId}`)
        .then((res) => {
            callback(res.data);
        })
        .catch((err) => {
            const errorMessage = err.response?.data?.message || 'Failed to publish post to channel';
            callback({ success: false, message: errorMessage });
        });
    },

    getPublicationChannels: function (callback, errorCallback) {
        instance.get('/posted-channels')
        .then((res) => {
            callback(res.data);
        })
        .catch((err) => {
            if (errorCallback) errorCallback(err);
            else callback({ success: false, message: 'Failed to load publication channels' });
        });
    },

    getActivePublicationChannels: function (callback, errorCallback) {
        instance.get('/posted-channels/active')
        .then((res) => {
            callback(res.data);
        })
        .catch((err) => {
            if (errorCallback) errorCallback(err);
            else callback({ success: false, message: 'Failed to load active publication channels' });
        });
    },

    createPublicationChannel: function (params, callback) {
        instance.post('/posted-channels', params)
        .then((res) => {
            callback(res.data);
        })
        .catch((err) => {
            const errorMessage = err.response?.data?.message || 'Failed to create publication channel';
            callback({ success: false, message: errorMessage });
        });
    },

    updatePublicationChannel: function (params, callback) {
        const { id, ...updateData } = params;
        instance.put(`/posted-channels/${id}`, updateData)
        .then((res) => {
            callback(res.data);
        })
        .catch((err) => {
            const errorMessage = err.response?.data?.message || 'Failed to update publication channel';
            callback({ success: false, message: errorMessage });
        });
    },

    deletePublicationChannel: function (params, callback) {
        instance.delete(`/posted-channels/${params.id}`)
        .then((res) => {
            callback(res.data);
        })
        .catch((err) => {
            const errorMessage = err.response?.data?.message || 'Failed to delete publication channel';
            callback({ success: false, message: errorMessage });
        });
    }
};

export default http;
