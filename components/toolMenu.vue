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
        <NuxtLink :to="{ name: 'tools-grid' }" :class="navigationMenuTriggerStyle()">
          Rotatable Grid
        </NuxtLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NuxtLink :to="{ name: 'tools-redefence' }" :class="navigationMenuTriggerStyle()">
          Redefence
        </NuxtLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NuxtLink :to="{ name: 'tools-scytale' }" :class="navigationMenuTriggerStyle()">
          Scytale
        </NuxtLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NuxtLink :to="{ name: 'tools-keywordTransposition' }" :class=" navigationMenuTriggerStyle()">
          Keyword Transposition
        </NuxtLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NuxtLink :to="{ name: 'tools-rot' }" :class="navigationMenuTriggerStyle()">
          ROT
        </NuxtLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NuxtLink :to="{ name: 'tools-vigenere' }" :class="navigationMenuTriggerStyle()">
          Vigenere
        </NuxtLink>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
</template>
