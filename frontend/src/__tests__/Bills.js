/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import "@testing-library/jest-dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";

import router from "../app/Router.js";
import userEvent from "@testing-library/user-event";

describe("Given I am connected as an employee", () => {
	beforeAll(() => {
		Object.defineProperty(window, 'localStorage', { value: localStorageMock })
		window.localStorage.setItem('user', JSON.stringify({
		  type: 'Employee'
		}))
		const root = document.createElement("div")
		root.setAttribute("id", "root")
		document.body.append(root)
		router()
	  })
	describe("When I am on Bills Page", () => {
		test("Then bill icon in vertical layout should be highlighted", async () => {
			window.onNavigate(ROUTES_PATH.Bills);
			await waitFor(() => screen.getByTestId("icon-window"));
			const windowIcon = screen.getByTestId("icon-window");
			expect(windowIcon).toHaveClass("active-icon");
		});
		test("Then bills should be ordered from earliest to latest", () => {
			document.body.innerHTML = BillsUI({ data: bills });
			const dates = screen
				.getAllByText(
					/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
				)
				.map((a) => a.innerHTML);
			const antiChrono = (a, b) => (a < b ? 1 : -1);
			const datesSorted = [...dates].sort(antiChrono);
			expect(dates).toEqual(datesSorted);
		});
	});
	describe("When I am on Bills Page, and I click an eye icon", () => {
		test("Then the bill's image modal should be shown", async () => {
			document.body.innerHTML = BillsUI({ data: [bills[0]] })
			//window.onNavigate(ROUTES_PATH.Bills);
			await waitFor(() => screen.getAllByTestId("icon-eye"));
			const eyeIcon = screen.getAllByTestId("icon-eye")[0];
			
			const openModalMock = jest.fn(() => {})
			eyeIcon.addEventListener('click', openModalMock)
			userEvent.click(eyeIcon);
			expect(openModalMock).toHaveBeenCalled()
			const modal = await waitFor(() => document.getElementById("modaleFile"))
			console.log(modal)
			const openBillUrl = await waitFor(() => screen.getByTestId(`open-${bills[0].fileUrl}`))
			expect(openBillUrl).toBeTruthy()
		});
	});
	/*
	// test d'intégration GET
	describe("Given I am a user connected as Admin", () => {
		describe("When I navigate to Dashboard", () => {
		test("fetches bills from mock API GET", async () => {
			localStorage.setItem("user", JSON.stringify({ type: "Admin", email: "a@a" }));
			const root = document.createElement("div")
			root.setAttribute("id", "root")
			document.body.append(root)
			router()
			window.onNavigate(ROUTES_PATH.Dashboard)
			await waitFor(() => screen.getByText("Validations"))
			const contentPending  = await screen.getByText("En attente (1)")
			expect(contentPending).toBeTruthy()
			const contentRefused  = await screen.getByText("Refusé (2)")
			expect(contentRefused).toBeTruthy()
			expect(screen.getByTestId("big-billed-icon")).toBeTruthy()
		})
		})
	})*/
});
