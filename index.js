class DogApp {
  constructor () {
    this.apiPath = 'https://api.thedogapi.com/'
    this.breedsPath = 'v1/breeds/'
    this.imagePath = 'v1/images/'
    this.favorites = JSON.parse(localStorage.getItem('favorites')) || []
    this.cardContainer = null
    this.init()
  }

  fetchFromApi (url) {
    return fetch(url).then((response) => {
      if (!response.ok) {
        throw Error(response.statusText)
      }
      return response.json()
    })
  }

  fetchImage (breed) {
    const breedImage = `${this.apiPath}${this.imagePath}${breed.reference_image_id}`
    return this.fetchFromApi(breedImage).then((imageData) => ({
      ...breed,
      imageData: imageData.url
    }))
  }

  fetchBreedByID (id) {
    return this.fetchFromApi(`${this.apiPath}${this.breedsPath}${id}`)
  }

  randomIndex (max) {
    return Math.floor(Math.random() * max)
  }

  fetchRandomBreeds () {
    if (!this.cardContainer) return
    this.cardContainer.innerHTML = '<div class="loader"></div>'
    this.fetchFromApi(`${this.apiPath}${this.breedsPath}`)
      .then((breeds) => {
        const breedPromises = Array.from({ length: 4 }, () => {
          const breedIndex = this.randomIndex(breeds.length)
          const breed = breeds[breedIndex]
          breeds.splice(breedIndex, 1)
          return this.fetchImage(breed)
        })
        return Promise.all(breedPromises)
      })
      .then(this.updateUIWithImages.bind(this))
      .catch(console.error)
  }

  fetchFavoriteBreeds () {
    if (this.favorites.length === 0) {
      this.cardContainer.innerHTML =
        '<div class="emptyListMessage">You have no favorite breeds yet. Start adding!</div>'
      return
    }
    this.cardContainer.innerHTML = '<div class="loader"></div>'
    const fetchPromises = this.favorites.map((fav) =>
      this.fetchBreedByID(fav.id)
    )
    Promise.all(fetchPromises)
      .then((breeds) => Promise.all(breeds.map(this.fetchImage.bind(this))))
      .then(this.updateUIWithImages.bind(this))
      .catch(console.error)
  }

  isFavorite (id) {
    return this.favorites.some((favorite) => favorite.id === id)
  }

  updateUIWithImages (breedsWithImages) {
    if (!this.cardContainer) return
    this.cardContainer.innerHTML = ''
    breedsWithImages.forEach(this.createCard.bind(this))
  }

  createDomElement (tag, props = {}) {
    const element = document.createElement(tag)
    Object.assign(element, props)
    return element
  }

  toggleFavorite (id, isFavorite, favoriteButton) {
    if (isFavorite) {
      this.favorites = this.favorites.filter((fav) => fav.id !== id)
      favoriteButton.classList.remove('favorites')
    } else {
      this.favorites.push({ id })
      favoriteButton.classList.add('favorites')
    }
    localStorage.setItem('favorites', JSON.stringify(this.favorites))
  }

  createPropertyRow (text) {
    const row = document.createElement('div')
    const propertyIcon = this.createDomElement('i', { className: 'fa fa-paw' })
    row.append(propertyIcon, text)
    return row
  }

  createTemperamentRow (temperament) {
    const temperamentTraits = this.createDomElement('div', {
      className: 'card-properties__temperament'
    })
    temperament.split(', ').map((trait) => {
      const traitElement = this.createDomElement('span', {
        className: 'card-properties__trait',
        innerText: trait
      })
      temperamentTraits.append(traitElement)
    })
    return temperamentTraits
  }

  createCard (data) {
    if (typeof data !== 'object' || data === null) {
      throw new Error("Expected an object for parameter 'data'")
    }
    const {
      id,
      name,
      weight,
      height,
      life_span,
      bred_for,
      temperament,
      imageData
    } = data

    const favoriteButton = this.createDomElement('button', {
      className: this.isFavorite(id)
        ? 'card-button__favorite favorites'
        : 'card-button__favorite',
      innerText: '❤',
      onclick: () =>
        this.toggleFavorite(id, this.isFavorite(id), favoriteButton)
    })

    const breedCard = this.createDomElement('div', { className: 'card' })
    breedCard.append(favoriteButton)

    const cardImageWrapper = this.createDomElement('div', {
      className: 'card-image__wrapper'
    })
    const cardImage = this.createDomElement('img', {
      className: 'card-image__image',
      alt: name,
      src: imageData
    })
    cardImageWrapper.appendChild(cardImage)

    const cardProperties = this.createDomElement('div', {
      className: 'card-properties'
    })

    const cardTitle = this.createDomElement('div', {
      className: 'card-properties__title',
      innerText: `${name}`
    })
    cardProperties.appendChild(cardTitle)
    if (weight && weight.metric) {
      cardProperties.append(
        this.createPropertyRow(`${weight.metric} kg of cuteness`)
      )
    }
    if (height && height.metric) {
      cardProperties.append(
        this.createPropertyRow(`${height.metric} cm short`)
      )
    }
    if (life_span) { cardProperties.append(this.createPropertyRow(`${life_span} of love`)) }
    if (bred_for) cardProperties.append(this.createPropertyRow(bred_for))
    if (temperament) { cardProperties.append(this.createTemperamentRow(temperament)) }

    breedCard.append(cardImageWrapper, cardProperties)
    this.cardContainer.append(breedCard)
  }

  init () {
    const title = this.createDomElement('div', {
      className: 'app-title',
      innerText: 'Pup Picker'
    })
    const subTitle = this.createDomElement('div', {
      className: 'app-subTitle',
      innerText: 'Unleash the Perfect Breed for Your Lifestyle'
    })
    const buttonContainer = this.createDomElement('div', {
      className: 'button-container'
    })
    const refreshButton = this.createDomElement('button', {
      className: 'app-button__refresh',
      innerHTML: 'Get Random Pups',
      onclick: this.fetchRandomBreeds.bind(this)
    })
    const favoritesButton = this.createDomElement('button', {
      className: 'app-button__favorites',
      innerHTML: 'Edit My Favorite',
      onclick: this.fetchFavoriteBreeds.bind(this)
    })
    buttonContainer.append(refreshButton, favoritesButton)

    this.cardContainer = this.createDomElement('div', {
      className: 'card-container'
    })
    document.body.append(title, subTitle, buttonContainer, this.cardContainer)

    this.fetchRandomBreeds()
  }
}
new DogApp()
