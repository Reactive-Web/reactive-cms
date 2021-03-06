<template lang="html">
  <div
    v-bind:class="{ 'select-wrapper': true, open: show }"
    v-on:click="showOptions"
    v-click-outside="clickOutsite"
  >
    <i class="material-icons icon">
      {{ getIconName() }}
    </i>
    <label>
      {{ $t(label) }}
    </label>
    <div
      id="select-options"
      v-bind:class="{
        'top': openInTop,
        'bottom': !openInTop,
      }"
      v-if="show"
      >
      <VuePerfectScrollbar class="scroll-area">
        <div
          class="item"
          v-for="option in selectOptions"
          v-on:click="onSelect(option.value)"
        >
          {{ $t(option.name) }}
        </div>
      </VuePerfectScrollbar>
    </div>
  </div>
</template>

<script>
import VuePerfectScrollbar from 'vue-perfect-scrollbar'


export default {
  props: [
    'onSelectOption',
    'label',
    'selectOptions',
    'openInTop',
  ],
  data() {
    return {
      currentValue: '',
      show: false,
    }
  },
  components: {
    VuePerfectScrollbar,
  },
  methods: {
    showOptions: function () {
      this.show = !this.show
    },
    onSelect: function (value) {
      this.currentValue = value
      this.onSelectOption(this.currentValue)
    },
    clickOutsite: function (event) {
      this.show = false
    },
    getIconName: function () {
      let iconName = this.show ? 'expand_less' : 'expand_more'
      if (this.openInTop)
        return this.show ? 'expand_more' : 'expand_less'

      return iconName
    },
  },
}
</script>

<style scoped lang="css">
.select-wrapper {
  -webkit-user-select: none;
  align-self: center;
  background: transparent;
  border-radius: 4px;
  border: 1px solid transparent;
  color: #616161;
  cursor: pointer;
  display: flex;
  font-size: 12px;
  font-weight: 400;
  height: 14px;
  outline: none;
  padding: 5px 15px;
  position: relative;
  user-select: none;
}

.select-wrapper label {
  cursor: pointer;
  text-transform: uppercase;
}

.select-wrapper:hover {
  background-color: #1a73e81c;
}

.select-wrapper:hover label,
.select-wrapper:hover .icon {
  color: #1a73e8 !important;
}

.select-wrapper.open .icon,
.select-wrapper.open label {
  z-index: 3;
}

.select-wrapper .icon {
  font-size: 20px;
  line-height: 1;
  margin-right: 5px;
  position: relative;
  align-self: center;
}

#select-options {
  background-color: white;
  border-radius: 4px;
  box-shadow: rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px;
  left: 0;
  list-style: none;
  margin: 0;
  max-height: 150px;
  min-width: 112px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  right: 0;
  z-index: 2;
}

#select-options .scroll-area {
  max-height: 150px;
}

.top {
  bottom: 0;
  padding: 0 0 26px 0;
}

.bottom {
  padding: 26px 0 0 0;
  top: 0;
}

#select-options.top {
  padding-bottom: 24px;
}

#select-options.bottom {
  padding-top: 24px;
}

#select-options .item {
  background-color: white;
  padding: 5px 15px;
  text-transform: capitalize;
}

#select-options .item:hover {
  background-color: #1a73e81c;
  color: #1a73e8 !important;
}

.select-wrapper.open {
  background-color: white;
}
</style>
