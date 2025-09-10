import { ref, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export function useUrlParams() {
    const route = useRoute();
    const router = useRouter();

    // Реактивные ссылки на параметры поиска
    const searchQuery = ref('');
    const statusFilter = ref('');
    const categoryFilter = ref('');
    const channelFilter = ref('');
    const dateFromFilter = ref('');
    const dateToFilter = ref('');
    const sortField = ref('created_at');
    // Направление больше не используется — всегда desc на сервере
    const sortOrder = ref('desc');
    const page = ref(1);

    // Функция для обновления URL с новыми параметрами
    const updateUrl = (params = {}) => {
        const query = { ...route.query };
        
        // Обновляем параметры
        Object.keys(params).forEach(key => {
            if (params[key] && params[key] !== '') {
                query[key] = params[key];
            } else {
                delete query[key];
            }
        });

        // Удаляем пустые значения
        Object.keys(query).forEach(key => {
            if (!query[key] || query[key] === '') {
                delete query[key];
            }
        });

        // Обновляем URL без перезагрузки страницы
        router.replace({ query });
    };

    // Функция для чтения параметров из URL
    const readFromUrl = () => {
        const query = route.query;
        
        searchQuery.value = query.search || '';
        statusFilter.value = query.status || '';
        categoryFilter.value = query.category || '';
        channelFilter.value = query.channel || '';
        dateFromFilter.value = query.date_from || '';
        dateToFilter.value = query.date_to || '';
        // Читаем новое поле filter, далее алиасы
        sortField.value = query.filter || query.sort || query.sort_field || 'created_at';
        sortOrder.value = query.order || query.sort_order || 'desc';
        page.value = parseInt(query.page) || 1;
    };

    // Функция для очистки всех фильтров
    const clearAllFilters = () => {
        searchQuery.value = '';
        statusFilter.value = '';
        categoryFilter.value = '';
        channelFilter.value = '';
        dateFromFilter.value = '';
        dateToFilter.value = '';
        sortField.value = 'created_at';
        sortOrder.value = 'desc';
        page.value = 1;
        
        updateUrl({
            search: '',
            status: '',
            category: '',
            channel: '',
            date_from: '',
            date_to: '',
            sort_field: '',
            sort_order: '',
            page: ''
        });
    };

    // Функция для обновления конкретного параметра
    const updateParam = (key, value) => {
        console.log('updateParam called:', { key, value });
        switch (key) {
            case 'search':
                searchQuery.value = value;
                break;
            case 'status':
                statusFilter.value = value;
                break;
            case 'category':
                categoryFilter.value = value;
                break;
            case 'channel':
                channelFilter.value = value;
                break;
            case 'date_from':
                dateFromFilter.value = value;
                break;
            case 'date_to':
                dateToFilter.value = value;
                break;
            case 'filter':
            case 'sort':
            case 'sortBy':
            case 'sort_field':
                sortField.value = value;
                break;
            case 'order':
            case 'sort_order':
            case 'dir':
                sortOrder.value = value;
                break;
            case 'page':
                page.value = parseInt(value) || 1;
                break;
        }
        
        updateUrl({ [key]: value });
    };

    // Функция для получения всех параметров в формате для API
    const getApiParams = () => {
        const params = {
            // 1. search
            text: searchQuery.value || undefined,
            // 2. категория
            category: categoryFilter.value || undefined,
            // 3. все остальное сортировки
            filter: sortField.value,
            order: sortOrder.value,
            sort: sortField.value,
            sort_field: sortField.value,
            sort_order: sortOrder.value,
            // остальные параметры
            page: page.value,
            limit: 24,
            is_unique: statusFilter.value
                ? statusFilter.value === "unique"
                    ? true
                    : false
                : undefined,
            channel_id: channelFilter.value || undefined,
            date_from: dateFromFilter.value
                ? new Date(dateFromFilter.value).toISOString()
                : undefined,
            date_to: dateToFilter.value
                ? new Date(dateToFilter.value + "T23:59:59").toISOString()
                : undefined,
        };

        // Удаляем undefined значения
        Object.keys(params).forEach((key) => {
            if (params[key] === undefined) {
                delete params[key];
            }
        });

        return params;
    };

    // Функция для проверки, есть ли активные фильтры
    const hasActiveFilters = computed(() => {
        return !!(
            searchQuery.value ||
            statusFilter.value ||
            categoryFilter.value ||
            channelFilter.value ||
            dateFromFilter.value ||
            dateToFilter.value ||
            sortField.value !== 'created_at' ||
            sortOrder.value !== 'desc'
        );
    });

    // Инициализация - читаем параметры из URL при создании
    readFromUrl();

    // Следим за изменениями в URL и обновляем локальные значения
    watch(() => route.query, () => {
        readFromUrl();
    }, { deep: true });

    return {
        // Реактивные значения
        searchQuery,
        statusFilter,
        categoryFilter,
        channelFilter,
        dateFromFilter,
        dateToFilter,
        sortField,
        sortOrder,
        page,
        
        // Функции
        updateUrl,
        updateParam,
        clearAllFilters,
        getApiParams,
        hasActiveFilters,
        readFromUrl
    };
}
