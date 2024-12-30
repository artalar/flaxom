<script setup lang="ts">
import { reatomRef } from '@reatom/npm-vue'
import { useQuasar } from 'quasar'
import { effect } from 'vue'
import { searchAtom, issuesResource, pageAtom, Issue } from './model'

const search = reatomRef(searchAtom)
const page = reatomRef(pageAtom)
const issuesPending = reatomRef(issuesResource.pendingAtom)
const issues = reatomRef(issuesResource.dataAtom)
const issuesError = reatomRef(issuesResource.errorAtom)

const $q = useQuasar()

effect(() => {
  if (!issuesError.value) return
  $q.notify({
    type: 'negative',
    icon: undefined,
    message: String(issuesError.value),
  })
})
</script>

<template>
  <q-layout>
    <q-page-container>
      <main>
        <q-input v-model="search" :loading="issuesPending" label="Search issues" rounded></q-input>
        <q-pagination v-model="page" :max="5" />
        <template v-for="issue of issues">
          <q-card flat bordered>
            <q-card-section class="issue-title">
              <q-avatar size="sm">
                <img :src="issue.user.avatar_url" :alt="issue.user.login" />
              </q-avatar>
              <a class="issue-link text-primary text-lg" :href="issue.html_url">{{ issue.title }}</a>
            </q-card-section>
            <q-separator> </q-separator>
            <q-card-section>
              <span class="issue-status">
                #{{ issue.number }} opened on {{ new Date(issue.created_at).toLocaleDateString() }}
              </span>
            </q-card-section>
          </q-card>
        </template>
      </main>
    </q-page-container>
  </q-layout>
</template>

<style scoped lang="scss">
main {
  display: flex;
  flex-direction: column;
  align-items: center;

  padding: 1rem;
  gap: 1rem;
}

main > * {
  width: 100%;
  max-width: 600px;
}

.issue-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.issue-link {
  text-decoration: none;
}

.issue-status {
  opacity: 0.5;
}
</style>
