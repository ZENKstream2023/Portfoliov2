<template>
    <div
      class="banner"
    >
      <div style="margin-top: 13em; padding-inline:40%; z-index:1">
        
      </div>
    </div>
</template>

<script>
export default {
  name: "PanelView",
  mounted() {
  // Obtenemos el elemento del span que mostrará el año actual
  const currentYear = document.getElementById("currentYear");
  // Obtenemos el año actual
  const year = new Date().getFullYear();
  // Actualizamos el contenido del span con el año actual
  currentYear.textContent = year;
},
};
</script>
<style scoped>
.banner {
  position: relative;
  background-size: cover;
  padding: 10em;
  height: 60vh;
  display: flex;
  align-items: center;
}

</style>