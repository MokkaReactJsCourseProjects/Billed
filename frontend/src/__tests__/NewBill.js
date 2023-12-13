/**
 * @jest-environment jsdom
 */
import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import router from "../app/Router.js";
import { ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import storeMock from "../__mocks__/store.js";
import userEvent from "@testing-library/user-event";


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
		document.body.innerHTML = NewBillUI();
	})
  describe("When I am on NewBill Page and I upload a valid image", () => {
    test("Then I should recieve a response with the bill key and the file path of the image", async () => {
      const container = new NewBill({document, onNavigate, store: storeMock, localStorage: window.localStorage});
      const mockFile = new File(['file content'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByTestId("file");
      await userEvent.upload(fileInput, mockFile);
      expect(container.billId).toBe("1234");
      expect(container.fileUrl).toBe("https://localhost:3456/images/test.jpg");
    });
  });
  describe("When I am on NewBill Page and I upload an invalid image", () => {
    test("Then an alert should be created that says that the image format isn't accepted", async () => {
      window.alert = jest.fn();
      const container = new NewBill({document, onNavigate, store: storeMock, localStorage: window.localStorage});
      const mockFile = new File(['file content'], 'test.tif', { type: 'image/tiff' });
      const fileInput = screen.getByTestId("file");
      await userEvent.upload(fileInput, mockFile);
      expect(window.alert).toHaveBeenCalledWith("Le format .tiff n'est pas accepté !");
      expect(container.billId).toBe(null);
      expect(container.fileUrl).toBe(null);
    });
  });
  describe("When I am on NewBill Page and I submit the form", () => {
    test("Then it should render the Bill Page", async () => {
      const onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname });
			};
      new NewBill({document, onNavigate, store: storeMock, localStorage: window.localStorage});
      const form = screen.getByTestId("form-new-bill");
      await fireEvent.submit(form);
      expect(screen.getAllByText("Mes notes de frais")).toBeTruthy();
    });
  });
})
