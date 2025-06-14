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
    page="Stuff"
    headline="So ya'll know what we have installed already."
  />

  <section>
    <div class="container max-w-6xl py-64 mx-auto ">
      <h2 class="m-auto mb-12 text-4xl font-bold text-center text-dblue">
        Swiper.js
      </h2>
      <edgeSwiper />
    </div>
  </section>

  <section>
    <div class="container max-w-6xl py-64 mx-auto ">
      <h2 class="m-auto mb-12 text-4xl font-bold text-center text-dblue">
        Masonry Gallery with Lighbox
      </h2>
      <edgeGallery />
    </div>
  </section>

  <section>
    <div class="container max-w-6xl py-64 mx-auto ">
      <h2 class="m-auto mb-12 text-4xl font-bold text-center text-dblue">
        Reveal Animation on Scroll
      </h2>
      <edgeScrollRevealAnim />
    </div>
  </section>
</template>
