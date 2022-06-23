//TODO DB variable
let DB;

//TODO campos del formulario
const mascotaInput = document.querySelector('#mascota');
const propietarioInput = document.querySelector('#propietario');
const telefonoInput = document.querySelector('#telefono');
const fechaInput = document.querySelector('#fecha');
const horaInput = document.querySelector('#hora');
const sintomasInput = document.querySelector('#sintomas');

//TODO UI
const formulario = document.querySelector('#nueva-cita');
const contenedorCitas = document.querySelector('#citas');

//TODO Modo Edicion
let editando = false;

//TODO Clases
class Citas {
  constructor() {
    this.citas = [];
  }
  agregarCita(cita) {
    this.citas = [...this.citas, cita];
  }
  eliminarCita(id) {
    this.citas = this.citas.filter(cita => cita.id !== id);
  }
  editarCita(citaActualizada) {
    this.citas = this.citas.map(cita => cita.id === citaActualizada.id ? citaActualizada : cita);
  }
}

class UI {
  imprimirAlerta(mensaje, tipo) {
    //*Crear el div
    const divMensaje = document.createElement('div');
    divMensaje.classList.add('text-center', 'alert', 'd-block', 'col-12');

    //*Agregar clase en base al tipo de error
    if (tipo === 'error') {
      divMensaje.classList.add('alert-danger');
    } else if (tipo === 'warning') {
      divMensaje.classList.add('alert-warning');
    } else {
      divMensaje.classList.add('alert-success');
    }

    //*Mensaje de error
    divMensaje.textContent = mensaje;
    //FIXME  Inicio Validacion Mensajes repetidos 
    const contenido = document.querySelector('#contenido');
    const formulario = document.querySelector('.agregar-cita');
    if (contenido.children.length <= 3) {
      if (contenido.firstElementChild.classList[1] === formulario.classList[1]) {
        //* Agregar al DOM
        contenido.insertBefore(divMensaje, formulario);
        //* Quitar la alerta después de 3 segundos
        setTimeout(() => {
          divMensaje.remove();
        }, 3000);
      } else {
        //* Agregar al DOM
        contenido.insertBefore(divMensaje, formulario);
        if (contenido.children[0].className === contenido.children[1].className) {
          divMensaje.remove();
        } else {
          //* Agregar al DOM
          contenido.insertBefore(divMensaje, formulario);
          //* Quitar la alerta después de 3 segundos
          setTimeout(() => {
            divMensaje.remove();
          }, 3000);
        }
      }
    }
    //FIXME fin validacion mensajes repetidos
  }
  imprimirCitas() {
    //* Limpiar citas repetidas anteriores
    this.limpiarHTML();

    //TODO Leer el contenido de la base de datos
    const objectStore = DB.transaction('citas').objectStore('citas');

    objectStore.openCursor().onsuccess = (e) => { 
      console.log(e.target.result);
    };
  }

  limpiarHTML() {
    while (contenedorCitas.firstChild) {
      contenedorCitas.removeChild(contenedorCitas.firstChild);
    }
  }
}

//TODO Instancias
const administrarCitas = new Citas();
const ui = new UI();


//TODO Objeto main Formulario
const citaObj = {
  mascota: '',
  propietario: '',
  telefono: '',
  fecha: '',
  hora: '',
  sintomas: ''
};

//TODO funciones
//! Reiniciar Objeto
const reiniciarObjetoCita = (citaObj) => {
  citaObj.mascota = '';
  citaObj.propietario = '';
  citaObj.telefono = '';
  citaObj.fecha = '';
  citaObj.hora = '';
  citaObj.sintomas = '';
};
//! Agrega datos al objeto de citaObj
const datosCita = (e) => {
  citaObj[e.target.name] = e.target.value;
};
//! Valida y agrega una nueva cita a la clase de citas
const nuevaCita = (e) => {
  e.preventDefault();
  //* Extraer la informacion del objeto de cita
  const { mascota, propietario, telefono, fecha, hora, sintomas } = citaObj;
  //* Validar
  if (mascota === '' || propietario === '' || telefono === '' || fecha === '' || hora === '' || sintomas === '') {
    ui.imprimirAlerta('Todos los campos son obligatorios', 'error');
    return;
  }
  if (editando) {
    //! Modo Edicion
    //* Mostrar mensaje de exito
    ui.imprimirAlerta('Editado Correctamente', 'warning');

    //* Pasar el objeto de la cita a la edicion
    administrarCitas.editarCita({ ...citaObj });

    //* Cambiar el texto del boton
    formulario.querySelector('button[type="submit"]').textContent = 'Crear Cita';
    formulario.querySelector('button[type="submit"]').classList.remove('btn-info');
    formulario.querySelector('button[type="submit"]').classList.add('btn-success');
    //* Salir del modo edicion
    editando = false;
  } else {
    //! Modo Nueva Cita
    //* Generar un id único
    citaObj.id = Date.now();

    //* Creando nueva cita
    //! pasamos una copia del objeto citaObj desestructurada
    administrarCitas.agregarCita({ ...citaObj });

    //TODO Insertar Registro en IndexDB

    const transaction = DB.transaction(['citas'], 'readwrite');

    //* Habilitar el objectStore
    const objectStore = transaction.objectStore('citas');

    //* Insertar en la BD
    objectStore.add(citaObj);

    transaction.oncomplete = () => {
      console.log('Cita Agregada');
      //* Mostrar mensaje de exito
      ui.imprimirAlerta('Mascota agregada correctamente');

    };

  }

  //* Reiniciar el formulario
  formulario.reset();

  //* Mostrar el HTML de las citas
  ui.imprimirCitas();

  //* Reiniciar objeto
  reiniciarObjetoCita(citaObj);
};
//! Eliminar una cita en especifico del array de objetos y del html
const eliminarCita = (id) => {
  //* Eliminar la cita
  administrarCitas.eliminarCita(id);
  //* Muestre un mensaje
  ui.imprimirAlerta('La cita se eliminó correctamente', 'warning');
  //* Refrescar las citas
  ui.imprimirCitas();
};

//! Editar una cita en especifico del array de objetos y del html
const cargarEdicion = (cita) => {
  const { mascota, propietario, telefono, fecha, hora, sintomas, id } = cita;

  //* Llenado de Inputs del formulario para edicion
  mascotaInput.value = mascota;
  propietarioInput.value = propietario;
  telefonoInput.value = telefono;
  fechaInput.value = fecha;
  horaInput.value = hora;
  sintomasInput.value = sintomas;

  //* LLenar el objeto
  citaObj.mascota = mascota;
  citaObj.propietario = propietario;
  citaObj.telefono = telefono;
  citaObj.fecha = fecha;
  citaObj.hora = hora;
  citaObj.sintomas = sintomas;
  citaObj.id = id;

  //* Cambiar el texto del boton
  formulario.querySelector('button[type="submit"]').textContent = 'Actualizar Datos';
  formulario.querySelector('button[type="submit"]').classList.remove('btn-success');
  formulario.querySelector('button[type="submit"]').classList.add('btn-info');


  //* Entrando al modo edicion
  editando = true;
};

//TODO creacion DB
const crearDB = () => {
  //* Crear la base de datos en version 1.0
  const crearDB = window.indexedDB.open('citas', 1);

  //! Si hay error
  crearDB.onerror = () => {
    console.log('Hubo un error');
  };

  //! Si todo sale bien
  crearDB.onsuccess = () => {
    console.log('Base de datos creada');
    DB = crearDB.result;
    //* Mostrar citas al cargar (Pero cuando IndexDB este listo)
    ui.imprimirCitas();
  };

  //* Definir el esquema
  crearDB.onupgradeneeded = (e) => {
    const db = e.target.result;

    const objectStore = db.createObjectStore('citas', {
      keyPath: 'id',
      autoIncrement: true
    });

    //* Definir todas la columnas
    objectStore.createIndex('mascota', 'mascota', { unique: false });
    objectStore.createIndex('propietario', 'propietario', { unique: false });
    objectStore.createIndex('telefono', 'telefono', { unique: false });
    objectStore.createIndex('fecha', 'fecha', { unique: false });
    objectStore.createIndex('hora', 'hora', { unique: false });
    objectStore.createIndex('sintomas', 'sintomas', { unique: false });
    objectStore.createIndex('id', 'id', { unique: true });

    console.log('Database creada y lista');
  };

};

//TODO Listeners

window.onload = () => {
  console.log('Documento listo');
  eventListeners();
  crearDB();
};

const eventListeners = () => {
  mascotaInput.addEventListener('input', datosCita);
  propietarioInput.addEventListener('input', datosCita);
  telefonoInput.addEventListener('input', datosCita);
  fechaInput.addEventListener('input', datosCita);
  horaInput.addEventListener('input', datosCita);
  sintomasInput.addEventListener('input', datosCita);

  formulario.addEventListener('submit', nuevaCita);
};