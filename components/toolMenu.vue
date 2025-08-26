<script setup lang="ts">
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  NavigationMenuViewport,
} from '@/components/ui/navigation-menu'
</script>

<template>
  <NavigationMenu>
    <NavigationMenuList>
      <NavigationMenuItem>
        <NuxtLink to="/" :class="navigationMenuTriggerStyle()">
          Home
        </NuxtLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NuxtLink :to="{ name: 'tools-copperplate' }" :class="navigationMenuTriggerStyle()">
          Copperplate
        </NuxtLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NuxtLink :to="{ name: 'tools-redefence' }" :class="navigationMenuTriggerStyle()">
          Redefence
        </NuxtLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NuxtLink :to="{ name: 'tools-keywordTransposition' }" :class=" navigationMenuTriggerStyle()">
          Keyword Transposition
        </NuxtLink>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
</template>
