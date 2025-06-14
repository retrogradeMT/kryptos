<script setup>
onMounted(() => {
  console.log('Hello world.')
})
</script>

<template>
  <Head>
    <Title>Edge Website - An awesome Edge website</Title>
    <Meta name="description" content="This is an Edge website template" />
    <Link rel="canonical" href="https://edgemarketingdesign.com/" />
  </Head>

  <titleSection
    page="404"
    headline="404 - Page Not Found"
  />
  <div class="min-h-[calc(100vh_-_586px)] w-full items-center justify-center flex flex-col">
    <h1 class="text-6xl font-bold mb-4">
      404
    </h1>
    <p class="text-xl mb-2">
      Page Not Found
    </p>
    <p class="text-md text-gray-400 mb-6">
      Looks like this page took an early return and never came back.<br />
      Maybe it hit a <code class="bg-gray-800 px-1 py-0.5 rounded">null pointer</code>... or just rage-quit the DOM.
    </p>
    <a href="/" class="px-6 py-2 mt-2 transition-colors bg-lblue text-dblue hover:bg-opacity-80">
      Go Home & Debug Later
    </a>
  </div>
</template>
