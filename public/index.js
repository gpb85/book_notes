document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const dropdownList = document.getElementById("dropdownList");

  const debounce = (callback, wait) => {
    let timeoutId = null;
    return (...args) => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        callback(...args);
      }, wait);
    };
  };

  const handleDebouncedInput = async function () {
    const searchTerm = searchInput.value.trim();
    console.log("Searchterm: ", searchTerm);

    try {
      const books = await fetchBook(searchTerm);

      if (books && books.length > 0) {
        const keys = books.map((book) => book.key);
        const covers = books.map((book) => book.cover_id);
        const titles = books.map((book) => book.title);
        const authors = books.map((book) => book.author);
        const years = books.map((book) => book.year);

        await updateDropdown(keys, covers, titles, authors, years);
      } else {
        console.log("No books found or error occurred");
      }
    } catch (error) {
      console.error("Error updating dropdown list", error);
    }
  };

  searchInput.addEventListener("input", debounce(handleDebouncedInput, 500));

  async function fetchBook(searchTerm) {
    try {
      const response = await axios.get(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(
          searchTerm
        )}&limit=5`
      );

      const data = response.data.docs;
      console.log("Fetch data: ", data);

      if (!data || data.length === 0) {
        console.log("No books found");
        return [];
      }

      const books = data.map((book) => ({
        key: book.key,
        title: book.title,
        author: book.author_name
          ? book.author_name.join(", ")
          : "Unknown author",
        year: book.first_publish_year || "Unknown year",
        cover_id: book.cover_i ? book.cover_i : null,
      }));

      console.log("Processed books: ", books);
      return books; // Return the books array
    } catch (error) {
      console.error("Book fetch failed:", error.message);
      return [];
    }
  }

  async function updateDropdown(keys, cover_id, title, author, year) {
    const html = keys
      .map(
        (key, index) =>
          `<li>
            <a href="/book?key=${key}&title=${encodeURIComponent(
            title[index]
          )}&author=${encodeURIComponent(
            author[index]
          )}&year=${encodeURIComponent(year[index])}&cover=${
            cover_id[index] ? cover_id[index] : 0
          }">
            <img 
  src="${
    cover_id[index]
      ? `https://covers.openlibrary.org/b/id/${cover_id[index]}-L.jpg`
      : "https://openlibrary.org/static/images/icons/avatar_book-sm.png"
  }" 
  width="40" height="60" alt="book picture" />

            <div>
              <p><strong>${title[index]}</strong></p>
              <p>By ${author[index]}</p>
              <p><strong>${year[index]}</strong></p>
            </div>
          </a>
        </li>`
      )
      .join("");

    // Εισάγουμε το HTML στο dropdown
    dropdownList.innerHTML = html;
  }
});
