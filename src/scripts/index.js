import { enableValidation, clearValidation } from "./components/validation.js";
import { createCardElement, deleteCard, likeCard } from "./components/card.js";
import { openModalWindow, closeModalWindow, setCloseModalWindowEventListeners } from "./components/modal.js";
import { getCardList, getUserInfo, setUserInfo, setUserAvatar, setNewCard, deleteCardAPI, changeLikeCardStatus } from "./components/api.js";


const validationConfig = {
  formSelector: '.popup__form',
  inputSelector: '.popup__input',
  submitButtonSelector: '.popup__button',
  inactiveButtonClass: 'popup__button_disabled',
  inputErrorClass: 'popup__input_type_error',
  errorClass: 'popup__error_visible'
};

// DOM узлы
const placesWrap = document.querySelector(".places__list");

// Попапы
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const imageModalWindow = document.querySelector(".popup_type_image");
const infoModalWindow = document.querySelector(".popup_type_info"); // Попап статистики


const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

// Формы
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");

// Инпуты
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");
const avatarInput = avatarForm.querySelector(".popup__input");

// Кнопки открытия
const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");
const headerLogo = document.querySelector(".header__logo"); // Логотип

// Элементы профиля
const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");


// Открытие картинки
const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

// Сабмит профиля
const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  
  const submitButton = profileForm.querySelector('.popup__button');
  const originalText = submitButton.textContent;
  submitButton.textContent = "Сохранение...";

  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      submitButton.textContent = originalText;
    });
};

// Сабмит аватара
const handleAvatarFromSubmit = (evt) => {
  evt.preventDefault();
  
  const submitButton = avatarForm.querySelector('.popup__button');
  const originalText = submitButton.textContent;
  submitButton.textContent = "Сохранение...";

  setUserAvatar(avatarInput.value)
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      closeModalWindow(avatarFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      submitButton.textContent = originalText;
    });
};


// Удаление карточки
const handleDeleteCard = (cardElement, cardId) => {
  deleteCardAPI(cardId)
    .then(() => {
      deleteCard(cardElement);
    })
    .catch((err) => {
      console.log(err);
    });
};

// Лайк карточки
const handleLikeCard = (likeButton, cardId) => {
  const isLiked = likeButton.classList.contains("card__like-button_is-active");

  changeLikeCardStatus(cardId, isLiked)
    .then((updatedCard) => {
      const likeCount = likeButton.parentElement.querySelector(".card__like-count");
      if (likeCount) {
        likeCount.textContent = updatedCard.likes.length;
      }
      likeCard(likeButton); 
    })
    .catch((err) => {
      console.log(err);
    });
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  
  const submitButton = cardForm.querySelector('.popup__button');
  const originalText = submitButton.textContent;
  submitButton.textContent = "Создание..."; 

  setNewCard({
    name: cardNameInput.value,
    link: cardLinkInput.value,
  })
    .then((cardData) => {
      // Используем переменную cardData напрямую
      const newCard = createCardElement(
        cardData,
        {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: (likeButton) => handleLikeCard(likeButton, cardData._id),
          onDeleteCard: (cardElement) => handleDeleteCard(cardElement, cardData._id),
        },
        cardData.owner._id 
      );
      
      placesWrap.prepend(newCard);
      closeModalWindow(cardFormModalWindow);
      cardForm.reset();
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      submitButton.textContent = originalText;
    });
};

const handleLogoClick = () => {
  getCardList()
    .then((cards) => {
      const contentInfo = infoModalWindow.querySelector('.popup__content');
      
      // Сохраняем кнопку закрытия, чистим остальное
      const closeBtn = contentInfo.querySelector('.popup__close');
      contentInfo.innerHTML = '';
      contentInfo.append(closeBtn);

      const statsTitle = document.createElement('h3');
      statsTitle.classList.add('popup__title');
      statsTitle.textContent = "Статистика";

      const statsDl = document.createElement('dl');
      statsDl.classList.add('popup__info');

      let likesSum = 0;
      const uniqueUsersSet = new Set();
      const usersNamesMap = {};

      cards.forEach((card) => {
        likesSum += card.likes.length;
        uniqueUsersSet.add(card.owner._id);
        // Записываем имя для вывода
        if (!usersNamesMap[card.owner._id]) {
          usersNamesMap[card.owner._id] = card.owner.name;
        }
      });

      // Хелпер создания строки (внутри функции)
      const createStatRow = (key, val) => {
        const template = document.querySelector('#popup-info-definition-template').content;
        const row = template.querySelector('.popup__info-item').cloneNode(true);
        row.querySelector('.popup__info-term').textContent = key;
        row.querySelector('.popup__info-description').textContent = val;
        return row;
      };

      // Заполняем статистику
      statsDl.append(createStatRow("Всего карточек:", cards.length));
      statsDl.append(createStatRow("Всего лайков:", likesSum));
      statsDl.append(createStatRow("Всего пользователей:", uniqueUsersSet.size));

      if (cards.length > 0) {
        // Форматер даты
        const dateOpt = { year: "numeric", month: "long", day: "numeric" };
        const firstDate = new Date(cards[cards.length - 1].createdAt).toLocaleDateString("ru-RU", dateOpt);
        const lastDate = new Date(cards[0].createdAt).toLocaleDateString("ru-RU", dateOpt);

        statsDl.append(createStatRow("Первая создана:", firstDate));
        statsDl.append(createStatRow("Последняя создана:", lastDate));
      }


      // Список юзеров
      const usersTitle = document.createElement('p');
      usersTitle.classList.add('popup__text');
      usersTitle.textContent = "Активные пользователи:";
      
      const usersUl = document.createElement('ul');
      usersUl.classList.add('popup__list');

      uniqueUsersSet.forEach((id) => {
        const userTpl = document.querySelector('#popup-info-user-preview-template').content;
        const li = userTpl.querySelector('.popup__list-item').cloneNode(true);
        li.textContent = usersNamesMap[id];
        usersUl.append(li);
      });

      // Сборка
      contentInfo.append(statsTitle, statsDl, usersTitle, usersUl);
      
      openModalWindow(infoModalWindow);
    })
    .catch((err) => {
      console.log(err);
    });
};


profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFromSubmit);
headerLogo.addEventListener("click", handleLogoClick);

openProfileFormButton.addEventListener("click", () => {
  clearValidation(profileForm, validationConfig);
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  clearValidation(avatarForm, validationConfig);
  avatarForm.reset();
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  clearValidation(cardForm, validationConfig);
  cardForm.reset();
  openModalWindow(cardFormModalWindow);
});

// Закрытие всех попапов
const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});

// Валидация
enableValidation(validationConfig);



Promise.all([getCardList(), getUserInfo()])
  .then(([cards, userData]) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;

      const currentUserId = userData._id; 

      cards.forEach((cardData) => {
          const cardElement = createCardElement(
            cardData, 
            {
              onPreviewPicture: handlePreviewPicture,
              onLikeIcon: (likeButton) => handleLikeCard(likeButton, cardData._id),
              onDeleteCard: (cardElement) => handleDeleteCard(cardElement, cardData._id),
            },
            currentUserId 
          );
        placesWrap.append(cardElement);
      })
    })
  .catch((err) => {
    console.log(err);
  });

// проверка