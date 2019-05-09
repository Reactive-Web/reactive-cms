<template lang="html">
  <div class="settings-wrapper">
    <div class="header">
      <NavigationButtons />
      <h2>Dashboard</h2>
    </div>
    <LoadingBar v-if="isLoading"/>
    <BoxWrapper>
      <div class="content-wrapper">
        <h2>Activity</h2>
        <div class="dashboard-activity">
          <div class="section" v-for="model in dashboard.models">
            <span class="model">
              {{ model.get("model") }}: {{ model.get("total") }}
            </span>
            <div class="activity-items">
              <div
                class="activity-item"
                v-if="model.get('model') === 'user'"
                v-for="item in model.get('last')"
              >
                <div>
                  <span class="tag">
                    ID:
                  </span>
                  {{ item.id }}
                </div>
                <div>
                  <span class="tag">
                    Name:
                  </span>
                  {{ item.user_name }}
                </div>
                <div>
                  <span class="tag">
                    Date:
                  </span>
                  {{ item.user_registration_date }}
                </div>
              </div>
              <div
                class="activity-item"
                v-if="model.get('model') === 'post'"
                v-for="item in model.get('last')"
              >
                <div>
                  <span class="tag">
                    ID:
                  </span>
                  {{ item.id }}
                </div>
                <div>
                  <span class="tag">
                    Title:
                  </span>
                  {{ item.post_title }}
                </div>
                <div>
                  <span class="tag">
                    Date:
                  </span>
                  {{ item.post_date }}
                </div>
              </div>
              <div
                class="activity-item"
                v-if="model.get('model') === 'page'"
                v-for="item in model.get('last')"
              >
                <div>
                  <span class="tag">
                    ID:
                  </span>
                  {{ item.id }}
                </div>
                <div>
                  <span class="tag">
                    Title:
                  </span>
                  {{ item.page_title }}
                </div>
                <div>
                  <span class="tag">
                    Date:
                  </span>
                  {{ item.page_date }}
                </div>
              </div>
              <div
                class="activity-item"
                v-if="model.get('model') === 'media'"
                v-for="item in model.get('last')"
              >
                <div>
                  <span class="tag">
                    ID:
                  </span>
                  {{ item.id }}
                </div>
                <div>
                  <span class="tag">
                    Name:
                  </span>
                  {{ item.media_original_name }}
                </div>
                <div>
                  <span class="tag">
                    Date:
                  </span>
                  {{ item.media_date }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BoxWrapper>
  </div>
</template>


<script>
import BoxWrapper from './templates/box-wrapper.vue'
import NavigationButtons from './templates/navigation-buttons.vue'
import LoadingBar from './templates/loading-bar.vue'

export default {
  data() {
    return {
      dashboard: new this.$models.Dashboard(),
      isLoading: false,
    }
  },
  components: {
    BoxWrapper,
    NavigationButtons,
    LoadingBar,
  },
  created() {
    this.getDashboardData()
  },
  methods: {
    getDashboardData: function() {
      this.isLoading = true
      this.dashboard
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
  },
}
</script>

<style scoped lang="css">

.settings-wrapper {
  position: relative;
}

.header {
  display: flex;
  margin: 0 20px 5px 20px;
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

.content-wrapper {
  box-sizing: content-box;
}

.model {
  color: #616161;
  font-size: 13px;
  font-weight: bold;
  text-transform: capitalize;
}

.dashboard-activity {
  display: flex;
  flex-flow: row wrap;
  flex-wrap: wrap;
}

.section {
  flex-grow: 1;
  width: 250px;
}

.activity-items {
    margin-bottom: 10px;
}

.activity-item {
  color: #616161;
  display: flex;
  flex-direction: column;
  font-size: 13px;
  margin: 0px 10px 10px 10px;
}

.tag {
  font-weight: bold;
}
</style>