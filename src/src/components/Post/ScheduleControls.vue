<template>
    <div class="space-y-4 mb-4">
        <div class="flex items-center gap-2">
            <input id="schedule" type="checkbox" v-model="scheduleModel" />
            <label for="schedule" class="text-sm">Опубликовать позже</label>
        </div>
        <div
            v-if="scheduleModel"
            class="space-y-3 pl-6 border-l-2 border-gray-200"
        >
            <DateTimePicker v-model="scheduledAtModel" />
        </div>
    </div>
</template>

<script setup>
import { computed } from "vue";
import DateTimePicker from "@/components/DateTimePicker.vue";

const props = defineProps({
    schedule: { type: Boolean, default: false },
    scheduledAt: { type: String, default: "" },
});
const emit = defineEmits(["update:schedule", "update:scheduledAt"]);

const scheduleModel = computed({
    get: () => props.schedule,
    set: (v) => emit("update:schedule", v),
});
const scheduledAtModel = computed({
    get: () => props.scheduledAt,
    set: (v) => emit("update:scheduledAt", v),
});
</script>
