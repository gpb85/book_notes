document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("searchInput");
  const dropdownList = document.getElementById("dropdownList");

  const debounce = (callback, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => callback(...args), delay);
    };
  };

  const handleDebouncedInput = async function () {
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) {
      dropdownList.style.display = "none";
      return;
    }

    try {
      const { bookTitle, bookAuthor, coverId, firstPublishYear } =
        await fetchData(searchTerm);
      await updateDropdown(bookTitle, coverId, bookAuthor, firstPublishYear);
    } catch (error) {
      console.error("Error updating dropdown list:", error);
    }
  };

  searchInput.addEventListener("input", debounce(handleDebouncedInput, 500));

  document.addEventListener("click", function (e) {
    if (!e.target.closest("#searchInput") && !e.target.closest(".dropdown")) {
      dropdownList.style.display = "none";
    }
  });
});

async function fetchData(searchTerm) {
  try {
    const response = await axios.get(
      `https://openlibrary.org/search.json?q=${searchTerm}&limit=5`
    );
    const data = response.data.docs;

    const bookTitle = data.map((book) => book.title);
    const bookAuthor = data.map((book) =>
      book.author_name ? book.author_name[0] : "Unknown"
    );
    const coverId = data.map((book) => book.cover_i || null);
    const firstPublishYear = data.map((book) => book.first_publish_year);
    console.log(firstPublishYear);

    return { bookTitle, bookAuthor, coverId, firstPublishYear };
  } catch (error) {
    console.error("Error fetching data:", error);
    return {
      bookTitle: [],
      bookAuthor: [],
      coverId: [],
      firstPublishYear: [],
    };
  }
}

async function updateDropdown(items, coverId, bookAuthor, firstPublishYear) {
  const dropdownList = document.getElementById("dropdownList");

  dropdownList.innerHTML = items
    .map((item, index) => {
      const imgSrc = coverId[index]
        ? `https://covers.openlibrary.org/b/id/${coverId[index]}-S.jpg`
        : "https://openlibrary.org/static/images/icons/avatar_book-sm.png";

      return `
        <li class="listItem">
          <a href="/book?title=${encodeURIComponent(
            item
          )}&author=${encodeURIComponent(bookAuthor[index])}&coverId=${
        coverId[index] || 0
      }">
            <img src="${imgSrc}" width="50" height="60" alt="Book Cover" />
            <div>
              <p><strong>${item}</strong></p>
              <p>Author: ${bookAuthor[index]}</p>
              <p>Year:${firstPublishYear[index]}
            </div>
          </a>
        </li>
      `;
    })
    .join("");

  dropdownList.style.display = items.length > 0 ? "block" : "none";
}
