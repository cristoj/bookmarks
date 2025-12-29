Siendo experto en typescript y Firebase tu misión será:

Desde un archivo json (/docs/bookmarks_marcador.json) se necesita importar en producción a este proyecto todos los bookmarks del archivo, las relaciones de keys son las siguiente (firebase/archivo json):

id => no tiene
url => url
title => titulo
description => descripcion
tags => tags (string separados por comas)
folderId => no tiene
userId => NIAi6T69C7Sbc63G9og7i4XuHC62
createdAt => fecha
updatedAt => fecha
screenshotError => null
folderId => null
screenshotStatus => no esta en el archivo json, se rellenara con el string "completed"
screenshotRetries => no esta en el archivo json, será 0
screenshotUrl => todas las imagenes estan en la carpeta /docs/screenshot, la relacion es con la key del archivo json img, ese es el nombre del archivo de la imagenque esta en la carpeta señalada, hay que hacer un upload a firebase (bookmarks-cristoj.firebasestorage.app) y añadir la ruta que retorne
screenshotPath=> será la ruta del archivo creado sin el dominio de Firebase storage (screenshots/NIAi6T69C7Sbc63G9og7i4XuHC62/01280300-0a0e-43a5-95b2-eea31202dd62.png)


La tarea será crear un archivo para esta importacion seguiendo las bases del proyecto, la funcionalidad será subirlo a produccion desde el una terminal si es mas sencillo, y pasando un parámetro para controlar el número de bookmarks a procesar así se podrá depurar con uno solo hasta que funcione y de ahí ejecutarlo para los demás. También tendrá que escribir un log con los booksmarks importados correctamente.

No hará falta realizar test, sólo se hará una única vez

Cualquier duda que tengas o cualquier cosa que necesites pídela