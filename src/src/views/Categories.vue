<template>
    <div class="min-h-screen bg-gray-50">
        <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <StatsCards
                v-if="!loading || categories.length > 0"
                :totalCount="totalCount"
                :data="categories"
                type="categories"
            />

            <Search
                :loading="loading"
                :categories="categories"
                @update:searchQuery="handleSearchChange"
                @clearFilters="handleClearFilters"
            />

            <CategoryTableSkeleton
                v-if="loading && categories.length === 0"
                :item-count="5"
            />

            <CategoriesTable
                v-else
                :categories="categories"
                :loading="loading"
                :selected-categories="selectedCategories"
                @update:selectedCategories="selectedCategories = $event"
                @delete="deleteCategory"
                @edit="editCategory"
                @create-category="createCategory"
            />

            <Actions
                :selected-categories="selectedCategories"
                @bulk-delete="bulkDelete"
                @clear-selection="clearSelection"
            />

            <CreateCategoryModal
                v-model:show="showCreateModal"
                :category="editingCategory"
                @submit="submitCategory"
            />

            <ConfirmModal
                :show="showConfirmModal"
                :message="confirmMessage"
                @confirm="onConfirm"
                @cancel="onCancelConfirm"
            />
        </main>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, inject, watch } from "vue";
import http from "@/js/http";
import StatsCards from "@/components/StatsCards.vue";
import Search from "@/components/Shared/Search.vue";
import CategoriesTable from "@/components/Category/Table.vue";
import Actions from "@/components/Shared/Actions.vue";
import CreateCategoryModal from "@/components/Modal/CreateCategoryModal.vue";
import PostTableSkeleton from "@/components/PostTableSkeleton.vue";
import ConfirmModal from "@/components/Modal/ConfirmModal.vue";

const CategoryTableSkeleton = PostTableSkeleton;

const refreshTrigger = inject("refreshTrigger", ref(0));
const setLoading = inject("setLoading", null);

const categories = ref([]);
const searchQuery = ref("");
const selectedCategories = ref([]);
const showCreateModal = ref(false);
const editingCategory = ref(null);
const loading = ref(false);
const totalCount = ref(0);

const showConfirmModal = ref(false);
const confirmMessage = ref("");
let confirmAction = null;
let confirmPayload = null;

function showConfirm(message, action, payload = null) {
    confirmMessage.value = message;
    confirmAction = action;
    confirmPayload = payload;
    showConfirmModal.value = true;
}

function onConfirm() {
    showConfirmModal.value = false;
    if (confirmAction) confirmAction(confirmPayload);
}
function onCancelConfirm() {
    showConfirmModal.value = false;
    confirmAction = null;
    confirmPayload = null;
}

const categoriesService = async () => {
    loading.value = true;
    if (setLoading) setLoading(true);

    try {
        return new Promise((resolve, reject) => {
            http.categories(
                (res) => {
                    if (res.success) {
                        let filteredCategories = res.data || [];

                        // Фильтрация по поисковому запросу
                        if (searchQuery.value) {
                            filteredCategories = filteredCategories.filter(
                                (category) =>
                                    category.name
                                        .toLowerCase()
                                        .includes(
                                            searchQuery.value.toLowerCase()
                                        ) ||
                                    (category.description &&
                                        category.description
                                            .toLowerCase()
                                            .includes(
                                                searchQuery.value.toLowerCase()
                                            ))
                            );
                        }

                        categories.value = filteredCategories;
                        totalCount.value = filteredCategories.length;
                    } else {
                        categories.value = [];
                        totalCount.value = 0;
                    }

                    loading.value = false;
                    if (setLoading) setLoading(false);
                    resolve(res.data);
                },
                (err) => {
                    console.error("Error loading categories:", err);
                    loading.value = false;
                    if (setLoading) setLoading(false);
                    reject(err);
                }
            );
        });
    } catch (error) {
        console.error("Error loading categories:", error);
        loading.value = false;
        if (setLoading) setLoading(false);
        throw error;
    }
};

// Добавляем debounce для поиска
let searchTimeout;
const handleSearchChange = (query) => {
    searchQuery.value = query;
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        categoriesService();
    }, 500);
};

const handleClearFilters = () => {
    searchQuery.value = "";
    categoriesService();
};

const createCategory = () => {
    editingCategory.value = null;
    showCreateModal.value = true;
};

const editCategory = (category) => {
    editingCategory.value = category;
    showCreateModal.value = true;
};

const submitCategory = (formData) => {
    if (editingCategory.value) {
        // Редактирование существующей категории
        http.updateCategory(formData, (res) => {
            if (res.success) {
                window.$toast.success("Категория успешно обновлена!");
                categoriesService();
            } else {
                window.$toast.error("Ошибка: " + res.message);
            }
        });
    } else {
        // Создание новой категории
        http.createCategory(formData, (res) => {
            if (res.success) {
                window.$toast.success("Категория успешно создана!");
                categoriesService();
            } else {
                window.$toast.error("Ошибка: " + res.message);
            }
        });
    }
};

const deleteCategory = (categoryId) => {
    showConfirm(
        "Вы уверены, что хотите удалить эту категорию?",
        (id) => {
            http.deleteCategory({ id }, (res) => {
                if (res.success) {
                    window.$toast.success("Категория успешно удалена!");
                    categoriesService();
                } else {
                    window.$toast.error("Ошибка: " + res.message);
                }
            });
        },
        categoryId
    );
};

const bulkDelete = () => {
    showConfirm(
        `Вы уверены, что хотите удалить ${selectedCategories.value.length} категорий?`,
        () => {
            const deletePromises = selectedCategories.value.map(
                (categoryId) => {
                    return new Promise((resolve) => {
                        http.deleteCategory({ id: categoryId }, resolve);
                    });
                }
            );
            Promise.all(deletePromises).then(() => {
                window.$toast.success("Выбранные категории удалены!");
                clearSelection();
                categoriesService();
            });
        }
    );
};

const clearSelection = () => {
    selectedCategories.value = [];
};

// Убираем дублирующий watch, так как обновление теперь происходит через события
// watch(refreshTrigger, () => {
//     if (refreshTrigger && refreshTrigger.value > 0) {
//         categoriesService();
//     }
// });

// Обработчик обновления категорий из Header
const refreshCategoriesHandler = async () => {
    console.log('Refresh categories event received');
    loading.value = true;
    if (setLoading) setLoading(true);
    
    try {
        await categoriesService();
    } catch (error) {
        console.error('Error refreshing categories:', error);
    } finally {
        loading.value = false;
        if (setLoading) setLoading(false);
    }
};

onMounted(() => {
    categoriesService();
    
    // Слушаем событие обновления категорий из Header
    window.addEventListener('refreshCategories', refreshCategoriesHandler);
});

onUnmounted(() => {
    // Очищаем event listener
    window.removeEventListener('refreshCategories', refreshCategoriesHandler);
});
</script>
