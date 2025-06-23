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
    posts: function (callback, errorCallback) {
        instance.get('/posts')
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
        instance.post('/login', params)
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
    }
};

export default http;
