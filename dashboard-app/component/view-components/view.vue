<template lang="html">
  <div class="view">
    <div class="header">
      <NavigationButtons/>
      <h2>
        {{ $t('View') }}
      </h2>
    </div>
    <LoadingBar v-if="isLoading"/>
    <BoxWrapper>
      <div class="content-wrapper">
        <InputText
          class="input"
          inputName="Name"
          v-bind:inputValue="view.view_name"
          v-bind:onChangeValue="onChangeInputValue"
          propName="view_name"
          v-bind:errorMessage="view.errors.view_name"
          helperMessage="At least 2 characters without spaces"
        />
        <InputText
          class="input"
          inputName="Description"
          v-bind:inputValue="view.view_description"
          v-bind:onChangeValue="onChangeInputValue"
          propName="view_description"
          v-bind:errorMessage="view.errors.view_description"
          helperMessage="At least 2 characters"
        />
      </div>
    </BoxWrapper>
    <div class="buttons-wrapper">
      <Button
        v-if="isNew"
        style="margin-left: 5px;"
        buttonIcon="close"
        v-bind:buttonAction="cancelCreateView"
      >
        {{ $t('Cancel') }}
      </Button>
      <Button
        v-if="isNew"
        buttonIcon="save"
        v-bind:buttonAction="createView"
        style="margin-left: 5px;"
      >
        {{ $t('Create') }}
      </Button>
      <Button
        v-if="!isNew"
        style="margin-left: 5px;"
        buttonIcon="remove"
        v-bind:buttonAction="showConfirmationModal"
      >
        {{ $t('Delete') }}
      </Button>
      <Button
        v-if="!isNew"
        buttonIcon="save"
        v-bind:buttonAction="updateView"
        style="margin-left: 5px;"
      >
        {{ $t('Update') }}
      </Button>
    </div>
  </div>
</template>

<script>
import BoxWrapper from '../templates/box-wrapper.vue'
import Button from '../templates/button.vue'
import InputText from '../templates/input-text.vue'
import NavigationButtons from '../templates/navigation-buttons.vue'
import LoadingBar from '../templates/loading-bar.vue'

export default {
  data() {
    return {
      isNew: true,
      view: new this.$models.View(),
      confirmationModalData: {
        modalTitle: 'Do you want delete this view?',
        modalDescription: 'This action will delete this view',
        cancelAction: this.cancelAction,
        acceptAction: this.acceptAction,
      },
      isLoading: false,
    }
  },
  components: {
    BoxWrapper,
    Button,
    InputText,
    NavigationButtons,
    LoadingBar,
  },
  created() {
    let routeParamId = this.$route.params.id
    if (routeParamId !== undefined) {
      this.isNew = false
      this.view.set('_id', routeParamId)
      this.getViewData()
    }
  },
  methods: {
    onChangeInputValue: function (propName, value) {
      this.view.set(propName, value)
    },
    getViewData: function () {
      this.isLoading = true
      this.view
        .fetch()
        .then(data => {
          this.isLoading = false
          if (data.getData().status_code) {
            this.$eventHub.$emit(
              'dashboard-app-error',
              data.getData().status_msg,
            )
            return
          }
        })
        .catch(err => {
          this.isLoading = false
          this.$eventHub.$emit('dashboard-app-error', err.message)
        })
    },
    deleteView: function () {
      this.isLoading = true
      this.view
        .delete()
        .then(data => {
          this.isLoading = false
          if (data.getData().status_code) {
            this.$eventHub.$emit(
              'dashboard-app-error',
              data.getData().status_msg,
            )
            return
          }
          this.$eventHub.$emit(
            'dashboard-app-success',
            data.getData().status_msg,
          )
        })
        .catch(err => {
          this.isLoading = false
          this.$eventHub.$emit('dashboard-app-error', err.message)
        })
      this.$router.replace({ name: 'views', params: { page: 1 } })
    },
    updateView: function () {
      if (Object.keys(this.view.errors).length)
        return

      this.view.setOption('initialViewContent', this.view.get('view_content'))
      this.isLoading = true
      this.view
        .put()
        .then(data => {
          this.isLoading = false
          if (data.getData().status_code) {
            this.$eventHub.$emit(
              'dashboard-app-error',
              data.getData().status_msg,
            )
            return
          }
          this.$eventHub.$emit(
            'dashboard-app-success',
            data.getData().status_msg,
          )
        })
        .catch(err => {
          this.isLoading = false
        })
    },
    showConfirmationModal: function () {
      this.$eventHub.$emit('confirmation-modal', this.confirmationModalData)
    },
    cancelAction: function () {
      this.$eventHub.$emit('confirmation-modal', null)
    },
    acceptAction: function () {
      this.$eventHub.$emit('confirmation-modal', null)
      this.deleteView()
    },
    createView: function () {
      this.isLoading = true
      this.view
      .save()
      .then(data => {
        this.isLoading = false
        if (data.getData().status_code) {
          this.$eventHub.$emit(
            'dashboard-app-error',
            data.getData().status_msg,
          )
          return
        }
        this.$router.replace({
          name: 'view-detail',
          params: { id: data.getData().data.id },
        })
        this.$eventHub.$emit(
          'dashboard-app-success',
          data.getData().status_msg,
        )
      })
      .catch(err => {
        this.isLoading = false
      })
    },
    cancelCreateView: function () {
      this.$router.back()
    },
  },
}
</script>

<style scoped lang="css">
.view {
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

.view-thumbnail {
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

.view-thumbnail:after {
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
</style>
