<template lang="html">
  <div>
    <div class="header">
      <NavigationButtons />
      <h2>{{ $t('media') }}</h2>
      <div class="buttons-wrapper">
        <Dropdown
          label="Bulk actions"
          v-bind:onSelectOption="onSelectOption"
          v-bind:selectOptions="selectOptions"
        >
        </Dropdown>
        <Button
          buttonIcon="add"
          v-bind:buttonAction="openNewMediaForm"
          style="margin-left: 5px;"
        >
          {{ $t('Add media') }}
        </Button>
      </div>
    </div>
    <LoadingBar v-if="isLoading"/>
    <BoxWrapper
      footerSize="12"
      customPaddingStyle="0 10px"
      >
      <ListTable
        v-if="mediaFiles.getModels().length"
        v-bind:collection="mediaFiles"
        v-bind:onClickRow="showPageDetail"
        v-bind:navigationBefore="navigationBefore"
        v-bind:navigationNext="navigationNext"
        v-bind:currentPage="currentPage"
        v-bind:totalPages="totalPages"
        v-bind:itemsSkipped="itemsSkipped"
        v-bind:totalItems="totalItems"
        v-bind:columnNames="columnNames"
        v-bind:itemPropNames="itemPropNames"
        v-bind:keyThumbnail="keyThumbnail"
        iconPropName="media_title"/>
    </BoxWrapper>
    <div class="navigation-wrapper">
      <div class="data">
        {{ $t('Rows from') }} {{ itemsSkipped + 1 }} {{ $t('to') }}
        {{ itemsSkipped + mediaFiles.getModels().length }} {{ $t('of') }} {{ totalItems }}
      </div>
      <div class="data">
        {{ $t('Page') }} {{ currentPage }} {{ $t('of') }} {{ totalPages }}
      </div>
      <ButtonIcon
        buttonIcon="navigate_before"
        v-bind:buttonAction="navigationBefore"
      >
      </ButtonIcon>
      <ButtonIcon
        buttonIcon="navigate_next"
        v-bind:buttonAction="navigationNext"
        style="margin-left: 5px;"
      >
      </ButtonIcon>
    </div>
  </div>
</template>

<script>
import BoxWrapper from './templates/box-wrapper.vue'
import Button from './templates/button.vue'
import Dropdown from './templates/dropdown.vue'
import NavigationButtons from './templates/navigation-buttons.vue'
import ButtonIcon from './templates/button-icon.vue'
import LoadingBar from './templates/loading-bar.vue'
import ListTable from './templates/list-table.vue'

export default {
  data() {
    return {
      mediaFiles: new this.$models.MediaCollection(),
      currentPage: this.$route.params.page,
      totalPages: 1,
      itemsSkipped: -1,
      totalItems: 0,
      itemsSelected: {},
      selectOptions: [
        {
          name: 'delete',
          value: 'delete',
        },
      ],
      isLoading: false,
      columnNames: [
        'Title',
        'Name',
        'Date',
      ],
      itemPropNames: [
        'media_title',
        'media_original_name',
        'media_date',
      ],
      keyThumbnail: 'media_name',
    }
  },
  components: {
    BoxWrapper,
    Button,
    Dropdown,
    NavigationButtons,
    ButtonIcon,
    LoadingBar,
    ListTable,
  },
  created() {
    this.getMedia()
    this.$eventHub.$on('items-selected', itemsSelected => {
      this.itemsSelected = itemsSelected
    })
  },
  methods: {
    getMedia: function () {
      this.isLoading = true
      this.mediaFiles.set('page_number', this.currentPage)
      let req = this.mediaFiles.fetch()
        .then(data => {
          this.isLoading = false
          this.totalPages = data.getData().total_pages
          this.itemsSkipped = data.getData().items_skipped
          this.totalItems = data.getData().total_items
        })
        .catch(err => {
          this.isLoading = false
        })
    },
    navigationBefore: function () {
      if (this.currentPage < 2) return
      this.currentPage--
      this.$router.push({ name: 'media', params: { page: this.currentPage } })
    },
    navigationNext: function () {
      if (parseInt(this.currentPage) + 1 > this.totalPages) return
      this.currentPage++
      this.$router.push({ name: 'media', params: { page: this.currentPage } })
    },
    showPageDetail: function (page) {
      this.$router.push({ name: 'media-detail', params: { id: page._id } })
    },
    openNewMediaForm: function () {
      this.$router.push({ name: 'new-media' })
    },
    onSelectOption: function (option) {
      let promisses = []
      let typeAction = ''
      this.isLoading = true
      if (option === 'delete') {
        typeAction = 'deleted'
        Object.values(this.itemsSelected).forEach(id => {
          let media = this.mediaFiles.find({ _id: id })
          promisses.push(media.delete())
        })
      }
      Promise.all(promisses)
        .then(responses => {
          this.isLoading = false
          let success = responses.length
          responses.forEach(response => {
            success = success - response.getData().status_code
          })
          if (!responses) {
            this.$eventHub.$emit(
              'dashboard-app-error',
              `Some media files it doesn't ${ typeAction }`,
            )
            return
          }
          this.$eventHub.$emit(
            'dashboard-app-success',
            `${ success } files/s ${ typeAction }`,
          )
        })
        .catch(err => {
          this.isLoading = false
          this.$eventHub.$emit('dashboard-app-error', err.message)
        })
      this.itemsSelected = {}
      this.$eventHub.$emit('clear-items-selected', '')
    },
  },
}
</script>

<style scoped lang="css">
.header {
  display: flex;
  margin: 0 10px 5px 10px;
}

h2 {
  align-self: center;
  color: #616161;
  display: flex;
  flex-grow: 1;
  font-size: 13px;
  font-weight: 500;
  margin: 0;
  text-transform: uppercase;
}

.buttons-wrapper {
  display: flex;
  flex-grow: 1;
  justify-content: flex-end;
}

.navigation-wrapper {
  color: #616161;
  display: flex;
  font-weight: 400;
  justify-content: flex-end;
  margin: 5px 10px;
  position: relative;
}

.navigation-wrapper .data {
  align-self: center;
  font-size: 12px;
  margin-left: 5px;
  margin-right: 5px;
}
</style>
