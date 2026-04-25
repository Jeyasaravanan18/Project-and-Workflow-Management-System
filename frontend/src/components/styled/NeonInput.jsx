import React from "react";
import styled from "styled-components";

const NeonInput = ({
  type = "text",
  placeholder,
  value,
  onChange,
  icon: Icon,
  name,
  ...props
}) => {
  return (
    <InputWrapper>
      {Icon && (
        <IconWrapper>
          <Icon size={18} />
        </IconWrapper>
      )}
      <StyledInput
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        name={name}
        $hasIcon={!!Icon}
        {...props}
      />
      <FocusLine />
    </InputWrapper>
  );
};

const InputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const IconWrapper = styled.div`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
  z-index: 2;
  transition: color 0.3s ease;
  pointer-events: none;
`;

const FocusLine = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%; /* Carbon bottom highlight when active */
  height: 2px;
  background: #0F62FE; /* Carbon Blue */
  transform: scaleX(0);
  transition: transform 0.2s ease;
`;

const StyledInput = styled.input`
  width: 100%;
  padding: ${(props) => (props.$hasIcon ? "14px 16px 14px 48px" : "14px 16px")};
  background: ${props => props.theme.bg && props.theme.bg.card ? props.theme.bg.card : '#F4F4F4'}; /* Handle outside/inside theme */
  border: none;
  border-bottom: 1px solid #8D8D8D; /* Carbon gray 50 */
  border-radius: 0; /* Carbon */
  color: ${props => props.theme.text && props.theme.text.primary ? props.theme.text.primary : '#161616'};
  font-size: 15px;
  outline: none;
  transition: all 0.2s ease;
  box-shadow: none; /* Carbon */

  &::placeholder {
    color: #A8A8A8; /* Carbon text-03 */
  }

  &:focus {
    background: ${props => props.theme.bg && props.theme.bg.card ? props.theme.bg.hover : '#E5E5E5'}; /* Carbon background hover equivalent on focus */
    box-shadow: none;

    & + ${FocusLine} {
      transform: scaleX(1);
    }

    ~ ${IconWrapper} {
      color: #0F62FE; /* Carbon Blue icon on focus */
    }
  }

  &:hover:not(:focus) {
    background: ${props => props.theme.bg && props.theme.bg.card ? props.theme.bg.hover : '#E5E5E5'};
  }
`;

export default NeonInput;
