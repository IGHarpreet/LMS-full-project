export function saveTokenInLocalStorage(tokenDetails){
    localStorage.setItem('userDetails',JSON.stringify(tokenDetails));
}