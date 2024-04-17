<template>
  <div
    class="banner"
  >
    <div style="margin-top: 21em; z-index:1">
      <h1 style="color: white">¡Bienvenido a nuestra plataforma de RRHH! Juntos, creamos un entorno donde el talento brilla y las oportunidades prosperan.</h1>
      <p style="color: white" class="lead">Encuentra tu sucursal.</p>
      <p class="lead">
        <a href="/locations" class="fw-bold py-1 border-white btn btn-primary pt-2" style="height:2.5em; background: linear-gradient(
    to right,
    #df18df,
    #4c9ae7
  );" type="submit">¡AQUÍ!</a>
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: "HomeView",
};
</script>
<style scoped>
.banner {
  position: relative;
  background-image: url('/public/rrhh.png');
  background-size: cover;
  padding: 10em;
  height: 100vh;
  display: flex;
  align-items: center;
}

.banner::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(78, 116, 148, 0.5); /* Color oscuro con opacidad */
}

.banner-title {
  color: white;
  font-size: 2.5em;
  font-weight: bold;
}
</style>