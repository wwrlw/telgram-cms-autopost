import { ref, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";

export function useUrlParams() {
    const route = useRoute();
    const router = useRouter();

    const sanitizeCategoryParam = (value) => {
        if (typeof value !== "string") return value;
        return value.replace(/\+/g, "").trim();
    };

    const restoreCategoryFromQuery = (value) => {
        if (typeof value !== "string") return value;
        const trimmed = value.trim();
        if (trimmed.includes("+")) return trimmed;
        return /\d+$/.test(trimmed) ? `${trimmed}+` : trimmed;
    };

    const searchQuery = ref("");
    const statusFilter = ref("");
    const categoryFilter = ref("");
    const channelFilter = ref("");
    const dateFromFilter = ref("");
    const dateToFilter = ref("");
    const sortField = ref("created_at");
    const sortOrder = ref("desc");
    const page = ref(1);

    const updateUrl = (params = {}) => {
        const query = { ...route.query };

        Object.keys(params).forEach((key) => {
            if (params[key] && params[key] !== "") {
                query[key] = params[key];
            } else {
                delete query[key];
            }
        });

        Object.keys(query).forEach((key) => {
            if (!query[key] || query[key] === "") {
                delete query[key];
            }
        });

        router.replace({ query });
    };

    const readFromUrl = () => {
        const query = route.query;

        searchQuery.value = query.search || "";
        statusFilter.value = query.status || "";
        categoryFilter.value = restoreCategoryFromQuery(query.category || "");
        channelFilter.value = query.channel || "";
        dateFromFilter.value = query.date_from || "";
        dateToFilter.value = query.date_to || "";
        sortField.value =
            query.filter || query.sort || query.sort_field || "created_at";
        sortOrder.value = query.order || query.sort_order || "desc";
        page.value = parseInt(query.page) || 1;
    };

    // Функция для очистки всех фильтров
    const clearAllFilters = () => {
        searchQuery.value = "";
        statusFilter.value = "";
        categoryFilter.value = "";
        channelFilter.value = "";
        dateFromFilter.value = "";
        dateToFilter.value = "";
        sortField.value = "created_at";
        sortOrder.value = "desc";
        page.value = 1;

        updateUrl({
            search: "",
            status: "",
            category: "",
            channel: "",
            date_from: "",
            date_to: "",
            filter: "",
            order: "",
        });
    };

    const updateParam = (key, value) => {
        switch (key) {
            case "search":
                searchQuery.value = value;
                break;
            case "status":
                statusFilter.value = value;
                break;
            case "category":
                categoryFilter.value = value;
                break;
            case "channel":
                channelFilter.value = value;
                break;
            case "date_from":
                dateFromFilter.value = value;
                break;
            case "date_to":
                dateToFilter.value = value;
                break;
            case "filter":
            case "sort":
            case "sortBy":
            case "sort_field":
                sortField.value = value;
                break;
            case "order":
            case "sort_order":
            case "dir":
                sortOrder.value = value;
                break;
            case "page":
                page.value = parseInt(value) || 1;
                return;
        }

        const nextValue =
            key === "category" ? sanitizeCategoryParam(value) : value;
        updateUrl({ [key]: nextValue });
    };

    const updateParams = (params = {}) => {
        const normalizedParams = { ...params };

        Object.entries(params).forEach(([key, value]) => {
            switch (key) {
                case "search":
                    searchQuery.value = value;
                    break;
                case "status":
                    statusFilter.value = value;
                    break;
                case "category":
                    categoryFilter.value = value;
                    normalizedParams[key] = sanitizeCategoryParam(value);
                    break;
                case "channel":
                    channelFilter.value = value;
                    break;
                case "date_from":
                    dateFromFilter.value = value;
                    break;
                case "date_to":
                    dateToFilter.value = value;
                    break;
                case "filter":
                case "sort":
                case "sortBy":
                case "sort_field":
                    sortField.value = value;
                    break;
                case "order":
                case "sort_order":
                case "dir":
                    sortOrder.value = value;
                    break;
                case "page":
                    page.value = parseInt(value) || 1;
                    delete normalizedParams[key];
                    break;
                default:
                    break;
            }
        });

        updateUrl(normalizedParams);
    };

    const getApiParams = () => {
        const params = {
            text: searchQuery.value || undefined,
            category: categoryFilter.value || undefined,
            filter: sortField.value,
            order: sortOrder.value,
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

        Object.keys(params).forEach((key) => {
            if (params[key] === undefined) {
                delete params[key];
            }
        });

        return params;
    };

    const hasActiveFilters = computed(() => {
        return !!(
            searchQuery.value ||
            statusFilter.value ||
            categoryFilter.value ||
            channelFilter.value ||
            dateFromFilter.value ||
            dateToFilter.value ||
            sortField.value !== "created_at" ||
            sortOrder.value !== "desc"
        );
    });

    readFromUrl();

    watch(
        () => route.query,
        () => {
            readFromUrl();
        },
        { deep: true }
    );

    return {
        searchQuery,
        statusFilter,
        categoryFilter,
        channelFilter,
        dateFromFilter,
        dateToFilter,
        sortField,
        sortOrder,
        page,

        updateUrl,
        updateParam,
        clearAllFilters,
        getApiParams,
        updateParams,
        hasActiveFilters,
        readFromUrl,
    };
}
