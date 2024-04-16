<template>
  <div class="banner">
    <div style="margin-top: 15em; padding-inline:40%; z-index:1">
     
      <!-- Renderizar el formulario según el estado formType -->
      <form v-if="formType === 'signin'" @submit.prevent="handleSignIn" class="signin">

        <img class="mb-4" src="logofooter.png" alt="" width="150em" height="130em">
        <h1 class="h3 mb-3 fw-normal"></h1>

        <div class="form-floating">
          <input type="email" class="form-control" id="floatingInput" placeholder="name@example.com" v-model="email">
          <label for="floatingInput">Email</label>
        </div>
        <div class="form-floating">
          <input type="password" class="form-control" id="floatingPassword" placeholder="Password" v-model="password">
          <label for="floatingPassword">Contraseña</label>
        </div>

        <button class="btn btn-primary w-100 py-2 mt-3" style="background: linear-gradient(
    to right,
    #df18df,
    #4c9ae7
  );" type="submit">Iniciar Sesión</button>
   <div class="text-center">
        <button class="btn btn-link" @click="setFormType('signup')">Crear Cuenta</button>
      </div>
      </form>
      <form v-else-if="formType === 'signup'" @submit.prevent="createAccount" class="signup">
        <img class="mb-4" src="logofooter.png" alt="" width="150em" height="130em">
        <h1 class="h3 mb-3 fw-normal"></h1>

        <div class="form-floating">
          <input type="email" class="form-control" id="floatingInput" placeholder="name@example.com" v-model="email">
          <label for="floatingInput">Email</label>
        </div>
        <div class="form-floating">
          <input type="password" class="form-control" id="floatingPassword" placeholder="Password" v-model="password">
          <label for="floatingPassword">Contraseña</label>
        </div>

        <button class="btn btn-primary w-100 py-2 mt-3" style="background: linear-gradient(
    to right,
    #df18df,
    #4c9ae7
  );" type="submit">Crear Cuenta</button>
   <div class="text-center">
        <button class="btn btn-link" @click="setFormType('signin')">Entrar</button>
      </div>
      </form>
    </div>
  </div>
</template>
  

<script>
import { ref} from 'vue';
import axios from 'axios';
import Global from '../Global'

export default {
  name: "LoginView",
  setup() {
   const url = ref(Global);
    const email = ref(null);
    const password = ref(null);

    const formType = ref('signup'); // Por defecto, muestra el formulario de registro
    const handleSignIn = async () => {
      try {
        const response = await axios.post(url.value.url +'signin', {
          email: email.value,
          password: password.value
        });
        // Manejar la respuesta del backend si es necesario
        console.log(response)
      } catch (error) {
        // Manejar el error si la solicitud falla
        console.log(error)
      }
    };
const createAccount = async () => {
      try {
        const response = await axios.post(url.value.url + 'signup', {
          email: email.value,
          password: password.value
        });
        // Manejar la respuesta del backend si es necesario
        console.log(response)
      } catch (error) {
        // Manejar el error si la solicitud falla
      }
    };


const setFormType = (type) => {
  formType.value = type;
};

    return {
      email,
      password,
      formType,
      handleSignIn,
      createAccount,
      setFormType,
    };
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