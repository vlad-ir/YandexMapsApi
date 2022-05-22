const form = document.querySelector('form');
const mapBox = document.getElementById('map');
const viewContainer = document.getElementById('viewContainer');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  mapBox.innerHTML = '';
  viewContainer.innerHTML = '';
  const inputAddress = document.getElementById('address').value;
  const submitButtonId = event.submitter.id;

  ymaps
    .geocode(inputAddress, {
      results: 1,
    })
    .then(function (res) {
      let firstGeoObject = res.geoObjects.get(0),
        coords = firstGeoObject.geometry.getCoordinates();
      if (firstGeoObject.getLocalities().join(', ') == 'Москва') {
        // Поиск станций метро.
        ymaps
          .geocode(coords, {
            kind: 'metro',
            results: 1,
          })
          .then(function (res) {
            metroGeoObject = res.geoObjects.get(0);
            let metroname = metroGeoObject.properties.get('name');
            let multiRoute = new ymaps.multiRouter.MultiRoute(
              {
                referencePoints: RouteDirection([inputAddress, metroname], submitButtonId),
                params: {routingMode: 'masstransit'},
              },
              {
                boundsAutoApply: true,
              }
            );

            let myMapRoute = new ymaps.Map('map', {
              center: coords,
              zoom: 12,
            });

            // Зададим максимально допустимое число маршрутов, возвращаемых мультимаршрутизатором.
            multiRoute.model.setParams({ results: 1 }, true);

            // Повесим обработчик на событие построения маршрута.
            multiRoute.model.events.add('requestsuccess', function () {
              // Получим протяженность маршрута и время в пути.
              let length = multiRoute.getActiveRoute().properties.get('distance').text;
              let time = multiRoute.getActiveRoute().properties.get('duration').text;
              viewContainer.innerHTML = `Ближайшая станция метро: ${metroname}<br/>Протяженность маршрута: ${length}<br/>Время в пути: ${time}`;
            });

            myMapRoute.geoObjects.add(multiRoute);
          });
      } else {
        mapBox.innerHTML = `<h3>Ошибка. Поиск возможен только по Москве</h3>`;
      }
    });
});

function RouteDirection(arrDirection, submitButtonId) {
  if (submitButtonId == 'right') {
    return arrDirection;
  } else {
    return [...arrDirection].reverse();
  }  
}
