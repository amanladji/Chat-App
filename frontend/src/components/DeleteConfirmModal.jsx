const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, messagePreview }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Delete Message
          </h3>
          
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Are you sure you want to delete this message? This action cannot be undone.
          </p>
          
          {messagePreview && (
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-4 max-h-20 overflow-hidden">
              <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                &quot;{messagePreview}&quot;
              </p>
            </div>
          )}
          
          <div className="flex gap-3 justify-end">
            <button
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              onClick={onConfirm}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;