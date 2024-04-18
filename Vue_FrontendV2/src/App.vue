<template>
  <header>
    <div
      style="
        position: fixed;
        background-color: white;
        z-index: 1;
        width: 100%;
        height: 8em;
      "
      class="row cover-container d-flex p-3 mx-auto shadow-sm"
    >
      <image
        style="padding-left: 2em;"
        src="logorrhh.png"
        class="col-1 float-md-start mb-5"
      />
      <nav
        style="justify-content: right; font-size: 1.15em"
        class="col-11 nav"
      >
        <a
          style="color: black"
          class="nav-link fw-bold py-1 active"
          aria-current="page"
          href="/"
          >Inicio</a
        >
        <a style="color: black" class="nav-link fw-bold py-1" href="/locations"
          >Sucursales</a
        >
        <a href="/login" class="fw-bold py-1 btn btn-primary" style="height:2.5em; margin-inline:1em; background: linear-gradient(
    to right,
    #df18df,
    #4c9ae7
  );" type="submit">Acceder</a>
        <!--<a style="color:black;" class="nav-link fw-bold py-1" href="/change">Modificar datos</a>-->
      </nav>
    </div>
  </header>
  <router-view />
  <footer style="bottom: 0; width: 100%; margin-top: 6em">
    <section
      class="row"
      style="
        height: 20em;
        background-color: black;
        color: white;
        list-style: none;
      "
    >
      <div class="col"></div>
      <article style="margin-top: 6em" class="col-1">
        <a target="_blank">
          <img
            src="logofooter.png"
            style="height:5em;"
            loading="lazy"
          />
        </a>
      </article>
      <article style="margin-top: 6em" class="col-1">
        <a href="https://www.izenpe.eus/inicio/">
        <img
          src="bakq.png"
          style="height:5em;"
          loading="lazy"
        />
        </a>
      </article>
      <article style="margin-top: 6em" class="col-1">
        <a href="https://www.bizkaia.eus/es/inicio">
        <img
          src="bforualdundia.png"
          style="height:5em;"
          loading="lazy"
        />
      </a>
      </article>
      <article class="col" style="margin-left:4em;">
        <nav style="text-align: left; margin-top: 2.5em">
          <a class="row" 
            >Condiciones generales</a
          >
          <a class="row" 
            >10T</a
          >
          <a class="row" 
            >Nomina</a
          >
          <a class="row" 
            >Seguridad y Protección </a
          >
          <a class="row" 
            >Declaraciones</a
          >
          <a class="row" >FAQs</a>
        </nav>
      </article>
      <article style="margin-top: 4em; text-align: left" class="col-2">
        <h5>CONTACTO</h5>
        <a
          style="text-decoration: none"
          class="row mb-1"
          href="https://goo.gl/maps/CfaBBSr9raGGYMabA"
          target="_blank"
        >
          <span style="color: white">Plaza Kurutzezar , Zaldibar (48250), Bizkaia</span>
        </a>
        <a
          style="text-decoration: none"
          class="row mb-1"
          href="tel:%20+34%20938%2056%2077%2088"
        >
          <span style="color: white" class="elementor-icon-list-text"
            >Tel: +34 634 412 771</span
          >
        </a>
        <a
          style="text-decoration: none"
          class="row mb-1"
          href="mailto:%20info@arenamotor.es"
          target="_blank"
        >
          <span style="color: white">webseobilbao@gmail.com</span>
        </a>
        <p class="mb-3 "> &copy; 2023-<span id="currentYear"></span>, Aritz Robledo</p>
      </article>
      <div class="col"></div>
    </section>
  </footer>
</template>
<script>
import { ref, onMounted } from 'vue';
export default {
  name: "LoginView",
  setup() {
   // const url = ref(Global);
    const currentYear = ref(null);
    onMounted(() => {
      // Obtenemos el elemento del span que mostrará el año actual
      currentYear.value = document.getElementById("currentYear");
      // Obtenemos el año actual
      const year = new Date().getFullYear();
      // Actualizamos el contenido del span con el año actual
      currentYear.value.textContent = year;
    });
    return {
      currentYear
    };
    }
  };
</script>
<style>
a {
  text-decoration: none;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  user-select: none;
}

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: white;
  text-decoration: none;
}
nav a:hover {
  font-weight: bold;
  color: #bf9c58;
  transition-delay: 0.1s;
  transition-duration: 0.25s, 5s;
}

nav a.router-link-exact-active {
  color: #42b983;
}

</style>
