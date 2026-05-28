<template>
  <div class="term_left_tab">
    <div class="main-menu">
      <a-tooltip
        v-for="i in menuTabsData.slice(0, -1)"
        :key="i.key"
        :title="$t(i.nameKey)"
        placement="right"
        :mouse-enter-delay="1"
      >
        <p
          v-if="i.key === 'files'"
          class="term_menu"
          :class="{ active: activeKey === i.key }"
          @click="files(i.key)"
        >
          <img
            :src="i.icon"
            alt=""
          />
        </p>
        <p
          v-else-if="i.key === 'knowledgecenter'"
          class="term_menu"
          :class="{ active: activeKey === i.key }"
          @click="menuClick(i.key)"
        >
          <img
            :src="i.icon"
            alt=""
          />
        </p>
        <p
          v-else-if="i.key === 'assets'"
          class="term_menu"
          :class="{ active: activeKey === i.key }"
          data-onboarding-id="assets-entry"
          @click="menuClick(i.key)"
        >
          <img
            :src="i.icon"
            alt=""
          />
        </p>
        <p
          v-else-if="i.key === 'ai'"
          class="term_menu"
          :class="{ active: activeKey === i.key }"
          data-onboarding-id="left-ai-toggle"
          @click="menuClick(i.key)"
        >
          <img
            :src="i.icon"
            alt=""
          />
        </p>
        <p
          v-else-if="i.key === 'snippets'"
          class="term_menu"
          :class="{ active: activeKey === i.key }"
          @click="menuClick(i.key)"
        >
          <img
            :src="i.icon"
            alt=""
          />
        </p>
        <p
          v-else
          class="term_menu"
          :class="{ active: activeKey === i.key }"
          @click="menuClick(i.key)"
        >
          <img
            :src="i.icon"
            alt=""
          />
        </p>
      </a-tooltip>

      <a-tooltip
        v-for="view in pluginViews"
        :key="view.id"
        :title="view.name"
        placement="right"
        :mouse-enter-delay="1"
      >
        <p
          class="term_menu"
          :class="{ active: activeKey === view.id }"
          @click="pluginMenuClick(view.id)"
        >
          <img
            v-if="view.icon.includes('/')"
            :src="pluginViewIconSrc(view.icon)"
            alt=""
          />
          <i
            v-else
            :class="view.icon"
            class="plugin-icon"
          ></i>
        </p>
      </a-tooltip>
    </div>

    <div class="bottom-menu">
      <a-tooltip
        v-for="i in menuTabsData.slice(-1)"
        :key="i.key"
        :title="$t(i.nameKey)"
        :mouse-enter-delay="1"
      >
        <div v-if="i.key === 'setting'">
          <p
            class="setting_menu"
            :class="{ active: activeKey === i.key }"
            data-onboarding-id="setting-entry"
            @click="userConfig"
          >
            <img
              :src="i.icon"
              alt=""
            />
          </p>
        </div>
        <div v-else>
          <p
            class="setting_menu"
            :class="{ active: activeKey === i.key }"
            @click="menuClick(i.key)"
          >
            <img
              :src="i.icon"
              alt=""
            />
          </p>
        </div>
      </a-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits(['toggle-menu', 'open-user-tab'])
import { menuTabsData } from './constants/data'
import { onMounted, onUnmounted, ref } from 'vue'
import { userInfoStore } from '@/store/index'
import { pinia } from '@/main'
import eventBus from '@/utils/eventBus'
import { convertFileLocalResourceSrc } from '@/utils/convertFileLocalResourceSrc'
const logger = createRendererLogger('leftTab')
let removePluginMetadataListener: (() => void) | null = null
const pluginViews = ref<any[]>([])

/** file:// URLs cannot be used in img src in the renderer; map via custom protocol (see main process). */
const pluginViewIconSrc = (icon: string) => convertFileLocalResourceSrc(icon)
const userStore = userInfoStore(pinia)
const activeKey = ref('workspace')
const menuClick = (key) => {
  let type = ''
  let beforeActive = ''
  if (activeKey.value == key) {
    type = 'same'
    if (key == 'ai') {
      beforeActive = userStore.stashMenu
    }
  } else {
    beforeActive = activeKey.value
    type = 'dif'
    userStore.updateStashMenu(activeKey.value)
    activeKey.value = key
  }

  emit('toggle-menu', {
    menu: activeKey.value,
    type,
    beforeActive,
    isPlugin: false
  })
}

const pluginMenuClick = (viewId: string) => {
  let type = ''
  let beforeActive = activeKey.value

  if (activeKey.value === viewId) {
    type = 'same'
  } else {
    type = 'dif'
    userStore.updateStashMenu(activeKey.value)
    activeKey.value = viewId
  }

  emit('toggle-menu', {
    menu: viewId,
    type,
    beforeActive,
    isPlugin: true
  })
}
const openAiRight = () => {
  let type = ''
  let beforeActive = ''
  if (activeKey.value == 'ai') {
    type = 'same'
    beforeActive = userStore.stashMenu
  } else {
    beforeActive = activeKey.value
    type = 'dif'
    userStore.updateStashMenu(activeKey.value)
    activeKey.value = 'ai'
  }

  emit('toggle-menu', {
    menu: 'openAiRight',
    type,
    beforeActive
  })
}
const userConfig = () => {
  emit('open-user-tab', 'userConfig')
}

const files = (key) => {
  emit('open-user-tab', 'files')
  menuClick(key)
}

const api = (window as any).api

const refreshPluginViews = async () => {
  const views = await api.getPluginViews()
  pluginViews.value = views
}

onMounted(async () => {
  eventBus.on('openAiRight', openAiRight)
  eventBus.on('openUserTab', (tab) => {
    emit('open-user-tab', tab)
  })
  try {
    const views = await api.getPluginViews()
    pluginViews.value = views
  } catch (e) {
    logger.error('Get View Error', { error: e })
  }
  removePluginMetadataListener = api.onPluginMetadataChanged(async () => {
    await refreshPluginViews()
  })
})

onUnmounted(() => {
  eventBus.off('openAiRight')
  eventBus.off('openUserTab')
  if (removePluginMetadataListener) {
    removePluginMetadataListener()
    removePluginMetadataListener = null
  }
})
</script>
<style lang="less">
.term_left_tab {
  width: 100%;
  height: 100%;
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-color: var(--bg-color-secondary);

  .main-menu,
  .bottom-menu {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 0 4px;
  }

  .term_menu,
  .setting_menu {
    width: 100%;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      background-color: var(--hover-bg-color);
    }

    &:active {
      transform: scale(0.95);
    }

    img {
      width: 20px;
      height: 20px;
      transition: all 0.3s ease;
      opacity: 0.45;
      filter: var(--icon-filter);
    }

    &:hover img,
    &.active img {
      opacity: 1;
      transform: scale(1.1);
    }
  }
}
</style>
