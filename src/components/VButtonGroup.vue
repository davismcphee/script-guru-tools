<template>
  <v-item-group class="v-btn-group">
    <slot />
  </v-item-group>
</template>

<style lang="scss">
.v-btn-group {
  border-radius: 4px;
  display: inline-flex;

  .theme--dark & {
    background: #424242;
  }

  .theme--light & {
    background: #fff;
  }

  .v-btn {
    border-radius: 0;
    justify-content: center;
    margin: 0;
    min-width: auto;
    padding: 0 8px;
    width: auto;

    &:not(:last-child) {
      border-right: 1px solid transparent;
    }

    &:first-child {
      border-radius: 4px 0 0 4px;
    }

    &:last-child {
      border-radius: 0 4px 4px 0;
    }
  }
}
</style>
