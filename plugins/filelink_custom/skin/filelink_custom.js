function insertFileLink(link) {
    var editor = document.getElementById('composebody');
    if (editor) {
        editor.value += '\nСкачать вложение по ссылке: ' + link;
    } else {
        console.error('Editor not found');
    }
}


document.addEventListener('DOMContentLoaded', function () {
    const basicScroller = document.querySelector("#layout-sidebar > div.scroller");
    if (!basicScroller) {
        console.error('Sidebar scroller not found');
        return;
    }

    var filelinkContainer = document.createElement('div');
    filelinkContainer.className = 'file-link-button mx-auto mt-2 d-flex flex-column align-items-center';
    filelinkContainer.style.width = '350px';

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-secondary attach w-100';
    button.textContent = 'Добавить вложение(я) > 15 мегабайт';

    filelinkContainer.appendChild(button);
    basicScroller.prepend(filelinkContainer);

    button.addEventListener('click', function () {

        var input = document.createElement('input');
        input.type = 'file';
        input.setAttribute('multiple', 'multiple');
        input.style.display = 'none';
        document.body.appendChild(input);

        input.addEventListener('change', function () {
            var files = this.files;
            if (files.length === 0) {
                document.body.removeChild(input);
                return;
            }

            for (var i = 0; i < files.length; i++) {
                (function (file, index) {
                    var formData = new FormData();
                    formData.append('file', file);

                    var fileId = 'progress-' + index + '-' + encodeURIComponent(file.name);

                    var progressWrapper = document.createElement('div');
                    progressWrapper.id = fileId;
                    progressWrapper.className = 'progress-wrapper d-flex align-items-center my-2 w-100';

                    var fileNameElement = document.createElement('span');
                    fileNameElement.className = 'file-name text-muted me-2';
                    fileNameElement.textContent = file.name;
                    progressWrapper.appendChild(fileNameElement);

                    var progressBar = document.createElement('div');
                    progressBar.className = 'progress flex-grow-1';
                    progressWrapper.appendChild(progressBar);

                    var progressFill = document.createElement('div');
                    progressFill.className = 'progress-bar bg-success';
                    progressFill.role = 'progressbar';
                    progressFill.style.width = '0%';
                    progressFill.setAttribute('aria-valuenow', '0');
                    progressFill.setAttribute('aria-valuemin', '0');
                    progressFill.setAttribute('aria-valuemax', '100');
                    progressBar.appendChild(progressFill);

                    var progressText = document.createElement('span');
                    progressText.className = 'progress-text small text-muted ms-2';
                    progressText.textContent = '0%';
                    progressWrapper.appendChild(progressText);

                    filelinkContainer.appendChild(progressWrapper);

                    var xhr = new XMLHttpRequest();
                    xhr.open('POST', './?_task=mail&_action=plugin.filelink_custom_upload', true);

                    xhr.upload.onprogress = function (event) {
                        if (event.lengthComputable) {
                            var percentComplete = (event.loaded / event.total) * 100;
                            progressFill.style.width = percentComplete + '%';
                            progressFill.setAttribute('aria-valuenow', Math.round(percentComplete));
                            progressText.textContent = Math.round(percentComplete) + '%';
                        } else {
                            progressText.textContent = 'Загрузка...';
                        }
                    };

                    xhr.onload = function () {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try {
                                var data = JSON.parse(xhr.responseText);
                                if (data.status === 'success' && data.filelink) {
                                    insertFileLink(data.filelink);
                                    progressText.textContent = 'Готово';
                                    console.log('File uploaded successfully:', file.name, 'Link:', data.filelink);
                                } else {
                                    progressText.textContent = 'Ошибка';
                                    console.error('Server response error for file:', file.name, 'Response:', data);
                                    alert('Ошибка: ' + (data.message || 'Неизвестная ошибка'));
                                }
                            } catch (e) {
                                progressText.textContent = 'Ошибка';
                                console.error('Failed to parse server response for file:', file.name, 'Error:', e.message, 'Response:', xhr.responseText);
                                alert('Ошибка обработки ответа сервера: ' + e.message);
                            }
                        } else {
                            progressText.textContent = 'Ошибка';
                            console.error('Server error for file:', file.name, 'Status:', xhr.status, 'Response:', xhr.responseText);
                            alert('Ошибка сервера: ' + xhr.status);
                        }

                        setTimeout(() => progressWrapper.remove(), 2000);
                    };

                    xhr.onerror = function () {
                        progressText.textContent = 'Ошибка';
                        console.error('Network error while uploading file:', file.name);
                        alert('Ошибка сети при загрузке файла: ' + file.name);
                        setTimeout(() => progressWrapper.remove(), 2000);
                    };

                    console.log('Starting upload for file:', file.name);
                    xhr.send(formData);
                })(files[i], i);
            }

            document.body.removeChild(input);
        });

        input.click();
    });
});