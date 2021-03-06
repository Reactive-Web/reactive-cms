<template lang="html">
  <div class="page">
    <div class="header">
      <NavigationButtons/>
      <h2>
        {{ $t('Page') }}
      </h2>
    </div>
    <LoadingBar v-if="isLoading"/>
    <BoxWrapper
      footerSize="12"
      customPaddingStyle="0 10px"
      style="position: relative">
      <div class="header-action-buttons-wrapper">
        <Button
          v-if="page.get('page_thumbnail')"
          buttonIcon="broken_image"
          v-bind:buttonAction="removeMedia"
          buttonColor="#f0f0f0">
          {{ $t('Remove image') }}
        </Button>
        <Button
          buttonIcon="image"
          v-bind:buttonAction="openMediaModal"
          style="margin-left: 5px;"
          buttonColor="#f0f0f0">
          {{ $t('Set image') }}
        </Button>
      </div>
      <div
        class="page-thumbnail"
        v-if="page.get('page_thumbnail')"
        v-bind:style="getCoverImage()"
      ></div>
      <div
        class="page-thumbnail"
        v-if="!page.get('page_thumbnail')"
        v-bind:style="getCoverColor()">
      </div>
      <div class="content-wrapper">
        <div
          v-if="!isNew"
          class="page-info-wrapper">
          <Link
            class="page-url-wrapper"
            linkColor="#f0f0f0"
            :linkURL="`/${ page.get('page_slug') }`"
            linkIcon="link"
            :linkLabel="`/${ page.get('page_slug') }`"
            linkTarget="_blank"/>
        </div>
        <InputText
          class="input"
          inputName="Title"
          v-bind:inputValue="page.page_title"
          v-bind:onChangeValue="onChangeInputValue"
          propName="page_title"
          v-bind:errorMessage="page.errors.page_title"
          helperMessage="At least 2 characters"/>
        <editor
          v-bind:content="editorContent"
          v-bind:onChangeContent="onChangeContent"
          v-bind:errorMessage="page.errors.page_content"
          helperMessage="At least 2 characters"/>
        <Gallery
          v-if="!isNew"
          title="Gallery"
          description="Gallery description"
          v-bind:onAddItem="galleryOnAddItem"
          v-bind:items="page.get('page_gallery')"
          v-bind:onClickItem="galleryOnClickItem"
          onlyImages="yes"
          maxItems="3"/>
        <div class="date-wrapper">
          {{ pageDate }}
        </div>
      </div>
    </BoxWrapper>
    <div class="buttons-wrapper">
      <DropdownSelect
        label="template"
        v-bind:initialIndexOption="currentPageTemplateIndex"
        v-bind:onSelectOption="onSelectPageTemplateOption"
        v-bind:selectOptions="pageTemplateOptions"
        style="margin-left: 5px;"
        openInTop="true"/>
      <DropdownSelect
        label="status"
        v-bind:initialIndexOption="pageStatusIndex"
        v-bind:onSelectOption="onSelectOption"
        v-bind:selectOptions="selectOptions"
        style="margin-left: 5px;"
        openInTop="true"/>
      <Button
        v-if="isNew"
        buttonIcon="close"
        v-bind:buttonAction="cancelCreate"
        style="margin-left: 5px;">
        {{ $t('Cancel') }}
      </Button>
      <Button
        v-if="isNew"
        buttonIcon="save"
        v-bind:buttonAction="validatePage"
        style="margin-left: 5px;">
        {{ $t('Create') }}
      </Button>
      <Button
        v-if="!isNew"
        buttonIcon="remove"
        v-bind:buttonAction="showConfirmationModal"
        style="margin-left: 5px;">
        {{ $t('Delete') }}
      </Button>
      <Button
        v-if="!isNew"
        buttonIcon="save"
        v-bind:buttonAction="validatePage"
        style="margin-left: 5px;">
        {{ $t('Update') }}
      </Button>
    </div>
  </div>
</template>

<script>
import Editor from '../editor/editor.vue'
import BoxWrapper from '../templates/box-wrapper.vue'
import Button from '../templates/button.vue'
import InputText from '../templates/input-text.vue'
import DropdownSelect from '../templates/dropdown-select.vue'
import NavigationButtons from '../templates/navigation-buttons.vue'
import Link from '../templates/link.vue'
import Gallery from '../templates/gallery.vue'
import LoadingBar from '../templates/loading-bar.vue'

export default {
  data() {
    return {
      isNew: true,
      page: new this.$models.Page(),
      editorContent: '',
      newVersionEditorContent: '',
      selectOptions: [
        {
          name: 'publish',
          value: 'publish',
        },
        {
          name: 'pending',
          value: 'pending',
        },
      ],
      pageStatusIndex: 0,
      pageDate: '',
      fileTemplates: new this.$models.FileTemplateCollection(),
      pageTemplateOptions: [],
      currentPageTemplateIndex: null,
      previewMediaMetaFields: [],
      confirmationModalData: {
        modalTitle: 'Do you want delete this page?',
        modalDescription: 'This action will delete this page',
        cancelAction: this.cancelAction,
        acceptAction: this.acceptAction,
      },
      confirmationUpdateContentModalData: {
        modalTitle: 'There is a new version of the content, do you want update?',
        modalDescription: 'This action will replate your current editor content',
        cancelAction: this.cancelAction,
        acceptAction: this.acceptActionAndReplace,
      },
      mediaModalData: {
        onlyImages: true,
        modalTitle: 'Set Featured Image',
        modalDescription: 'Chose one image or upload new',
        closeMediaModal: this.closeMediaModal,
        onMediaSelect: this.onMediaSelect,
      },
      previewMediaModalData: {
        onClose: this.closePreviewMediaModal,
        onRemove: this.removePreviewMediaModal,
        onSave: this.savePreviewMediaModal,
        metaFields: this.previewMediaMetaFields,
        file: this.previewFile,
      },
      isLoading: false,
    }
  },
  components: {
    Editor,
    DropdownSelect,
    BoxWrapper,
    Button,
    InputText,
    NavigationButtons,
    Link,
    Gallery,
    LoadingBar,
  },
  created() {
    let routeParamId = this.$route.params.id
    if (routeParamId !== undefined) {
      this.isNew = false
      this.page.set('_id', routeParamId)
      this.getPageData()
      this.setOnChangePage()
    } else
      this.page.set('page_status', 'publish')
    this.getFileTemplates()
  },
  methods: {
    setOnChangePage: function () {
      this.page.on('change', ({ attribute, value }) => {
        let hasUpdate = this.page.getOption('hasNewVersionContent')
        if (hasUpdate) {
          this.newVersionEditorContent = value
          this.page.setOption('initialPageContent', value)
          this.page.setOption('hasNewVersionContent', false)
          this.$eventHub.$emit('confirmation-modal', this.confirmationUpdateContentModalData)
        }
        if (attribute === 'page_status') {
          if (value === 'pending')
            this.pageStatusIndex = 1
          else
            this.pageStatusIndex = 0
        }
        if (attribute === 'page_date')
          this.pageDate = moment(value).format('MMMM Do YYYY, h:mm:ss a')
      })
    },
    onChangeInputValue: function (propName, value) {
      this.page.set(propName, value)
    },
    getPageData: function () {
      this.isLoading = true
      this.page.fetch()
        .then(data => {
          this.editorContent = this.page.get('page_content')
          this.page.setOption('initialPageContent', this.editorContent)
          if (this.page.get('page_status') === 'pending')
            this.pageStatusIndex = 1
          this.setPageTemplateIndex()
        })
        .finally(() => {
          this.isLoading = false
        })
    },
    deletePage: function () {
      this.isLoading = true
      this.page.delete()
        .finally(err => {
          this.isLoading = false
          this.$router.replace({ name: 'pages', params: { page: 1 } })
        })
    },
    validatePage: function () {
      this.page.validate().then((errors) => {
        if (!_.isEmpty(errors))
          return

        if (this.isNew) {
          this.createPage()
          return
        }
        this.updatePage()
      })
    },
    updatePage: function () {
      if (Object.keys(this.page.errors).length)
        return

      this.page.setOption('initialPageContent', this.page.get('page_content'))
      this.isLoading = true
      this.page.put()
        .finally(() => {
          this.isLoading = false
        })
    },
    createPage: function () {
      this.isLoading = true
      this.page.save()
        .then(data => {
          this.$router.replace({
            name: 'page-detail',
            params: { id: data.getData().data.id },
          })
        })
        .finally(() => {
          this.isLoading = false
        })
    },
    cancelCreate: function () {
      this.$router.back()
    },
    showConfirmationModal: function () {
      this.$eventHub.$emit('confirmation-modal', this.confirmationModalData)
    },
    cancelAction: function () {
      this.$eventHub.$emit('confirmation-modal', null)
    },
    acceptAction: function () {
      this.$eventHub.$emit('confirmation-modal', null)
      this.deletePage()
    },
    onSelectOption: function (option) {
      this.page.set('page_status', option.value)
    },
    onChangeContent: function ({ getJSON, getHTML }) {
      this.page.set('page_content', getHTML())
    },
    openMediaModal: function () {
      this.$eventHub.$emit('media-modal', this.mediaModalData)
    },
    closeMediaModal: function () {
      this.$eventHub.$emit('media-modal', null)
    },
    onMediaSelect: function (media) {
      let mediaData = {
        media_id: media.get('id'),
        media_file_name: media.get('media_name'),
        media_image: media.isImage(),
      }
      this.page.set('page_thumbnail', mediaData)
      this.closeMediaModal()
    },
    removeMedia: function () {
      this.page.set('page_thumbnail', '')
    },
    getFileTemplates: function () {
      this.isLoading = true
      this.fileTemplates.fetch()
        .then(data => {
          this.isLoading = false
          this.setPageTemplateOptions()
        })
        .finally(() => {
          this.isLoading = false
        })
    },
    onSelectPageTemplateOption: function (option) {
      this.page.set('page_template', option.value)
    },
    setPageTemplateIndex: function () {
      if (!this.pageTemplateOptions) return

      let templates = this.fileTemplates.getModels()
      let pageTemplate = this.page.get('page_template')
      this.currentPageTemplateIndex = 0
      for (let index in this.pageTemplateOptions) {
        let templateFullName = this.pageTemplateOptions[index].value
        if (templateFullName === pageTemplate) {
          this.currentPageTemplateIndex = index
          return
        }
      }
    },
    setPageTemplateOptions: function () {
      let templates = this.fileTemplates.getModels()
      this.pageTemplateOptions.push({
        name: 'none',
        value: '',
      })
      for (let template of templates) {
        let templateName = template.get('template_name')
        let templateFullName = template.get('template_full_name')
        this.pageTemplateOptions.push({
          name: templateName,
          value: templateFullName,
        })
      }
      this.setPageTemplateIndex()
    },
    getCoverImage: function () {
      return this.$getThumbnailURL(
        this.page.get('page_thumbnail').media_file_name,
      )
    },
    getCoverColor: function () {
      return this.$getHexColor(this.page.get('page_title'))
    },
    galleryOnAddItem: function (item) {
      let gallery = this.page.get('page_gallery')
      gallery.push(item)
      this.page.set('page_gallery', gallery)
    },
    galleryOnClickItem: function (item) {
      this.previewMediaMetaFields = []
      if (item.meta_fields)
        for (let metaField of item.meta_fields)
          this.previewMediaMetaFields.push(metaField)
      else
        this.setGalleryItemMetaFields()
      this.previewMediaModalData.file = item
      this.previewMediaModalData.metaFields = this.previewMediaMetaFields
      this.$eventHub.$emit('preview-media-modal', this.previewMediaModalData)
    },
    setGalleryItemMetaFields: function () {
      this.previewMediaMetaFields = [
        {
          meta_title: 'Title',
          meta_name: 'media_title',
          meta_value: '',
        },
        {
          meta_title: 'Description',
          meta_name: 'media_description',
          meta_value: '',
        },
      ]
    },
    closePreviewMediaModal: function () {
      this.$eventHub.$emit('preview-media-modal', null)
    },
    removePreviewMediaModal: function (item) {
      let pageGallery = this.page.get('page_gallery')
      let mediaIndex = null
      for (let index in pageGallery)
        if (pageGallery[index].media_id === item.media_id)
          mediaIndex = index
      pageGallery.splice(mediaIndex, 1)
      this.page.set('page_gallery', pageGallery)
      this.closePreviewMediaModal()
    },
    savePreviewMediaModal: function (item, metaFields) {
      item.meta_fields = metaFields
      let pageGallery = this.page.get('page_gallery')
      let mediaIndex = null
      for (let index in pageGallery)
        if (pageGallery[index].media_id === item.media_id)
          mediaIndex = index
      pageGallery[mediaIndex] = item
      this.closePreviewMediaModal()
    },
    acceptActionAndReplace: function () {
      this.$eventHub.$emit('confirmation-modal', null)
      this.editorContent = this.newVersionEditorContent
    },
  },
}
</script>

<style scoped lang="css">
.page {
  position: relative;
}

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
  bottom: -32px;
  display: flex;
  justify-content: flex-end;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  width: calc(100% - 20px);
  z-index: 1;
}

.page-thumbnail {
  background-color: #f8f8f8;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  box-sizing: border-box;
  color: #616161;
  display: flex;
  height: 200px;
  left: 0;
  overflow: hidden;
  padding: 0;
  pointer-events: none;
  position: absolute;
  right: 0;
  top: 0;
  width: 100%;
  z-index: 0;
}

.page-thumbnail:after {
  background-color: rgba(160, 160, 160, 0.5);
  bottom: 0;
  content: "";
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
}

.content-wrapper {
  box-sizing: content-box;
  margin-bottom: 50px;
margin-top: 170px;
  position: relative;
}

.header-action-buttons-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 0;
  position: relative;
  right: 0;
  top: 0;
  z-index: 1;
}

.page-info-wrapper {
  display: flex;
  position: absolute;
  right: 0;
  top: -46px;
}

.date-wrapper {
  color: #616161;
  display: block;
  font-size: 12px;
  font-weight: 500;
  margin-top: 15px;
  text-align: right;
}
</style>
