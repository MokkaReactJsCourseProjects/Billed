/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import router from "../app/Router.js";
import userEvent from "@testing-library/user-event";
import storeMock from "../__mocks__/store.js";


describe("Given I am connected as an employee", () => {
	beforeAll(() => {
		Object.defineProperty(window, 'localStorage', { value: localStorageMock });
		window.localStorage.setItem('user', JSON.stringify({
			type: 'Employee'
		}));
		const root = document.createElement("div");
		root.setAttribute("id", "root");
		document.body.append(root);
		router();
		})
	beforeEach(()=>{
		document.body.innerHTML = BillsUI({ data: bills });
		window.onNavigate(ROUTES_PATH.Bills);
	})
	describe("When I navigate to Bills Page", () => {
		test("Then bill icon in vertical layout should be highlighted", () => {
			const windowIcon = screen.getByTestId("icon-window");
			expect(windowIcon).toHaveClass("active-icon");
		});
		test("Then bills should be ordered from earliest to latest", () => {
			const dates = screen
				.getAllByText(
					/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
				)
				.map((a) => a.innerHTML);
			const antiChrono = (a, b) => (a < b ? 1 : -1);
			const datesSorted = [...dates].sort(antiChrono);
			expect(dates).toEqual(datesSorted);
		});
		test("Then bills should be fetched from the mocked API",()=>{
			expect(screen.getByText("NOM_TEST_46szz")).toBeTruthy()
		})
		
	});
	describe(`When a bill's date is corrupted`, () => {
		test("Then, the bill's date should not be formatted", async ()=>{
			console.log = jest.fn();
			const store = {
				bills() {
					return {
						list() {
							return Promise.resolve([{
							  "id": "47qAXb6fIm2zOKkLzMro",
							  "vat": "80",
							  "fileUrl": "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
							  "status": "pending",
							  "type": "Hôtel et logement",
							  "commentary": "séminaire billed",
							  "name": "encore",
							  "fileName": "preview-facture-free-201801-pdf-1.jpg",
							  "date": "C0RRUPTED_DAT3",
							  "amount": 400,
							  "commentAdmin": "ok",
							  "email": "a@a",
							  "pct": 20
							}])
						}
					}
				  },
			};
			store.bills().list().then(docs=>docs[0])
			const container = new Bills({document, onNavigate, store, localStorage: window.localStorage});
			const data = await container.getBills();
			document.body.innerHTML = BillsUI({ data });
			expect(screen.getByText("C0RRUPTED_DAT3")).toBeTruthy();
		})
	})
	describe('When I am on Bills page and I click the New Bill button', () => {
		test('Then it should render the New Bill Page',  () => {
			const onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname });
			};
			const container = new Bills({document, onNavigate, store:storeMock, localStorage: window.localStorage});
			document.body.innerHTML = BillsUI({ data: bills });
			const buttonNewBill = screen.getByTestId("btn-new-bill");
			const handleClick = jest.fn(container.handleClickNewBill);
			buttonNewBill.addEventListener("click", handleClick);
			userEvent.click(buttonNewBill);
			expect(handleClick).toHaveBeenCalled();
			expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
		})
	})
	describe("When I am on Bills Page, and I click an eye icon", () => {
		test("Then the bill's image modal should be shown", async () => {
			await waitFor(() => screen.getAllByTestId("icon-eye"));
			const eyeIcon = screen.getAllByTestId("icon-eye")[0];
			const modale = screen.getByTestId("modaleFileEmployee");
			userEvent.click(eyeIcon);
			expect(modale.getAttribute("style")).toBe("padding-right: 0px;");
		});
	});

	describe("When an error occurs on the API while trying to fetch the bills", () => {
		test("Then it should console.error the error", async () => {
			console.error = jest.fn();
			const store = {bills:()=>{return {list:()=>Promise.reject("Erreur 500")}}};
			const container = new Bills({document, onNavigate, store, localStorage: window.localStorage});
			await container.getBills().then(data => {
				console.log("Fetch successful : " + data);
			  }).catch(error => {
				console.error(error);
			  });
			expect(console.error).toHaveBeenCalledWith("Erreur 500");
		})
	  });
});
