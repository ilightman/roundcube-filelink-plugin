<?php
class filelink_custom extends rcube_plugin
{
    public $task = 'mail';

    private $upload_dir;
    private $base_url;

    public function init()
    {
        $rcmail = rcmail::get_instance();
        
        $this->load_config();
        $this->upload_dir = $rcmail->config->get('filelink_custom_upload_dir');
        $this->base_url = $rcmail->config->get('filelink_custom_base_url');

        $this->add_hook('attachment_upload', array($this, 'upload_handler'));
        $this->add_hook('attachment_get', array($this, 'download_handler'));

        if ($this->api->task == 'mail' && (isset($_GET['_action']) && $_GET['_action'] == 'compose')) {
                $this->include_script('skin/filelink_custom.js');
        }

        $this->register_action('plugin.filelink_custom_upload', array($this, 'ajax_upload'));
    }

    public function upload_handler($args)
    {
        $rcmail = rcmail::get_instance();

        if ($args['status'] && $args['path']) {
            $file_path = $args['path'];
            $file_name = $args['name'];
            $unique_id = uniqid() . '_' . basename($file_name);
            $target_path = $this->upload_dir . $unique_id;

            if (rename($file_path, $target_path)) {
                $filelink = $this->base_url . $unique_id;
                $args['result'] = array(
                    'filelink' => $filelink,
                    'name' => $file_name,
                    'size' => filesize($target_path),
                    'type' => $args['mimetype']
                );
            } else {
                $args['status'] = false;
                $args['error'] = 'Failed to move file to attachments directory';
            }
        }

        return $args;
    }

    public function ajax_upload()
    {
        $rcmail = rcmail::get_instance();

        try {

            if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
                throw new Exception('File upload failed with error code: ' . ($_FILES['file']['error'] ?? 'unknown'));
            }

            $file = $_FILES['file'];
            $file_path = $file['tmp_name'];
            $file_name = $file['name'];

            $updatedFilename = str_replace(' ', '_', basename($file_name));
            $unique_id = uniqid() . '_' . $updatedFilename;
            $target_path = $this->upload_dir . $unique_id;
            if (!move_uploaded_file($file_path, $target_path)) {
                throw new Exception('Ошибка в сохранении временного файла в ' . $target_path);
            }

            $filelink = $this->base_url . $unique_id;

            header('Content-Type: application/json');
            echo json_encode(['status' => 'success', 'filelink' => $filelink]);
            exit;

        } catch (Exception $e) {
            error_log('Filelink upload error: ' . $e->getMessage());

            header('Content-Type: application/json');
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
            exit;
        }
}
}