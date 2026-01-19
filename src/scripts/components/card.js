// Функция переключения класса лайка
export const likeCard = (likeButton) => {
  likeButton.classList.toggle("card__like-button_is-active");
};

// Функция удаления карточки из DOM
export const deleteCard = (cardElement) => {
  cardElement.remove();
};

// Вспомогательная функция получения шаблона
const getTemplate = () => {
  const cardTemplate = document.getElementById("card-template");
  const cardContent = cardTemplate.content.querySelector(".card");
  
  return cardContent.cloneNode(true);
};

export const createCardElement = (data, callbacks, userId) => {
  const { onPreviewPicture, onLikeIcon, onDeleteCard } = callbacks;
  
  const cardElement = getTemplate();
  
  // Элементы карточки
  const cardImage = cardElement.querySelector(".card__image");
  const cardTitle = cardElement.querySelector(".card__title");
  const deleteButton = cardElement.querySelector(".card__control-button_type_delete");
  const likeButton = cardElement.querySelector(".card__like-button");
  const likeCount = cardElement.querySelector(".card__like-count");

  // Заполняем данными
  cardTitle.textContent = data.name;
  cardImage.src = data.link;
  cardImage.alt = data.name;

  // Отрисовка количества лайков
  if (likeCount) {
    likeCount.textContent = data.likes.length;
  }

  // Проверка: есть ли мой лайк?
  const isLikedByMe = data.likes.some((user) => user._id === userId);
  if (isLikedByMe) {
    likeButton.classList.add("card__like-button_is-active");
  }

  // Проверка: моя ли это карточка? (для кнопки удаления)
  if (data.owner && data.owner._id !== userId) {
    deleteButton.remove();
  } else {
    // Вешаем обработчик удаления только если кнопка осталась
    if (onDeleteCard) {
      deleteButton.addEventListener("click", () => {
        onDeleteCard(cardElement);
      });
    }
  }

  // Обработчик лайка
  if (onLikeIcon) {
    likeButton.addEventListener("click", () => {
      onLikeIcon(likeButton);
    });
  }

  // Обработчик клика по картинке (превью)
  if (onPreviewPicture) {
    cardImage.addEventListener("click", () => {
      onPreviewPicture({ 
        name: data.name, 
        link: data.link 
      });
    });
  }

  return cardElement;
};
